-- =====================================================================
-- Pacer – Initiales Datenbankschema (Meilenstein 1)
-- Tabellen: profiles, goals, baselines, runner_profiles, activities
-- Einheiten: Strecken in Metern, Zeiten in Sekunden, Pace in s/km
-- Konventionen:
--   - Primärschlüssel heißen <tabelle_singular>_id (goal_id, activity_id …)
--   - Fremdschlüssel heißen genauso wie der Schlüssel, auf den sie zeigen
--   - Jede änderbare Tabelle hat created_at und updated_at
-- =====================================================================

-- pgvector schon aktivieren, die Gedächtnis-Tabellen folgen später
create extension if not exists vector with schema extensions;


-- =====================================================================
-- Enums
-- =====================================================================
create type public.goal_feasibility as enum ('realistic', 'ambitious', 'unrealistic');
create type public.fitness_level    as enum ('beginner', 'intermediate', 'advanced');
create type public.activity_source  as enum ('manual', 'strava');


-- ---------------------------------------------------------------------
-- Hilfsfunktion: setzt updated_at bei jedem UPDATE automatisch
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- =====================================================================
-- profiles: ein Eintrag pro Nutzer, gekoppelt an auth.users
-- Ausnahme von der Namenskonvention: Der Schlüssel heißt user_id statt
-- profile_id, weil er identisch mit auth.users.id ist und alle anderen
-- Tabellen ihn als user_id referenzieren.
-- =====================================================================
create table public.profiles (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  display_name  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Legt bei jeder Registrierung automatisch ein Profil an.
-- display_name kommt aus den Metadaten von supabase.auth.signUp().

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =====================================================================
-- goals: Soll-Zustand (Zieldistanz, Zielzeit, Wettkampfdatum)
-- =====================================================================
create table public.goals (
  goal_id        uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (user_id) on delete cascade,
  distance_m     integer not null check (distance_m > 0),
  target_time_s  integer not null check (target_time_s > 0),
  race_date      date not null,
  feasibility    public.goal_feasibility,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Höchstens ein aktives Ziel pro Nutzer
create unique index goals_one_active_per_user
  on public.goals (user_id)
  where is_active;

create index goals_user_id_idx on public.goals (user_id);

create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();


-- =====================================================================
-- baselines: Fragebogen-Antworten (Tabelle 1 im Konzept)
-- Bewusst ohne updated_at: Die Antworten sind eine Momentaufnahme und
-- werden nie geändert. Neue Angaben ergeben eine neue Zeile.
-- =====================================================================
create table public.baselines (
  baseline_id           uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles (user_id) on delete cascade,
  runs_per_week         smallint not null check (runs_per_week between 0 and 14),
  km_per_week           numeric(5, 1) not null check (km_per_week >= 0),
  longest_run_km        numeric(5, 1) not null check (longest_run_km >= 0),
  recent_5k_time_s      integer not null check (recent_5k_time_s > 0),
  running_since_months  smallint not null check (running_since_months >= 0),
  -- Wochentage nach ISO: 1 = Montag … 7 = Sonntag
  available_days        smallint[] not null
                          check (cardinality(available_days) > 0
                                 and available_days <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]),
  pain_location         text,
  pain_level            smallint check (pain_level between 0 and 10),
  created_at            timestamptz not null default now(),

  -- Körperstelle und Schmerzstärke nur gemeinsam oder gar nicht
  constraint baselines_pain_complete
    check ((pain_location is null) = (pain_level is null))
);

create index baselines_user_created_idx on public.baselines (user_id, created_at desc);


-- =====================================================================
-- runner_profiles: berechnetes Läuferprofil, eine Zeile pro Nutzer
-- (1:1 zu profiles, deshalb ist user_id gleichzeitig Primärschlüssel)
-- =====================================================================
create table public.runner_profiles (
  user_id                 uuid primary key references public.profiles (user_id) on delete cascade,
  fitness_level           public.fitness_level not null,
  predicted_time_s        integer check (predicted_time_s > 0),
  easy_pace_s_per_km      integer check (easy_pace_s_per_km > 0),
  tempo_pace_s_per_km     integer check (tempo_pace_s_per_km > 0),
  interval_pace_s_per_km  integer check (interval_pace_s_per_km > 0),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger runner_profiles_set_updated_at
  before update on public.runner_profiles
  for each row execute function public.set_updated_at();


-- =====================================================================
-- activities: Läufe, manuell (M1) oder aus Strava (später)
-- =====================================================================
create table public.activities (
  activity_id       uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (user_id) on delete cascade,
  source            public.activity_source not null default 'manual',
  strava_id         bigint unique,
  started_at        timestamptz not null,
  distance_m        integer not null check (distance_m > 0),
  duration_s        integer not null check (duration_s > 0),
  avg_heart_rate    smallint check (avg_heart_rate between 30 and 250),
  elevation_gain_m  integer check (elevation_gain_m >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Strava-Läufe brauchen eine strava_id, manuelle Läufe dürfen keine haben
  constraint activities_strava_id_matches_source
    check ((source = 'strava') = (strava_id is not null))
);

create index activities_user_started_idx on public.activities (user_id, started_at desc);

create trigger activities_set_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();


-- =====================================================================
-- Row Level Security: Nutzer sehen und ändern nur ihre eigenen Zeilen
-- (select auth.uid()) statt auth.uid(), damit Postgres den Wert nur
-- einmal pro Abfrage berechnet
-- =====================================================================
alter table public.profiles        enable row level security;
alter table public.goals           enable row level security;
alter table public.baselines       enable row level security;
alter table public.runner_profiles enable row level security;
alter table public.activities      enable row level security;

-- profiles: lesen und ändern. Anlegen übernimmt der Trigger,
-- löschen passiert über das Löschen des Accounts (cascade).
create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- goals: voller Zugriff auf eigene Ziele
create policy "Users can read own goals"
  on public.goals for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own goals"
  on public.goals for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own goals"
  on public.goals for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own goals"
  on public.goals for delete to authenticated
  using ((select auth.uid()) = user_id);

-- baselines: lesen, anlegen, löschen. Kein Update (Momentaufnahme).
create policy "Users can read own baselines"
  on public.baselines for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own baselines"
  on public.baselines for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own baselines"
  on public.baselines for delete to authenticated
  using ((select auth.uid()) = user_id);

-- runner_profiles: nur lesen. Schreiben darf nur die Regel-Engine
-- in der Edge Function (Secret Key umgeht RLS).
create policy "Users can read own runner profile"
  on public.runner_profiles for select to authenticated
  using ((select auth.uid()) = user_id);

-- activities: lesen und löschen für alle eigenen Läufe,
-- anlegen und ändern nur für manuelle Läufe. Strava-Importe
-- schreibt ausschließlich die Edge Function.
create policy "Users can read own activities"
  on public.activities for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own manual activities"
  on public.activities for insert to authenticated
  with check ((select auth.uid()) = user_id and source = 'manual');

create policy "Users can update own manual activities"
  on public.activities for update to authenticated
  using ((select auth.uid()) = user_id and source = 'manual')
  with check ((select auth.uid()) = user_id and source = 'manual');

create policy "Users can delete own activities"
  on public.activities for delete to authenticated
  using ((select auth.uid()) = user_id);