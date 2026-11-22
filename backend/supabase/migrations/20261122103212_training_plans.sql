-- =====================================================================
-- Pacer – Trainingspläne (Meilenstein 2)
-- Tabellen: training_plans, plan_phases, plan_sessions
-- Ein Plan besteht aus einer Phasenübersicht (z. B. Grundlage, Aufbau,
-- Spitze, Tapering) und konkreten Einheiten für die nächsten Wochen.
-- Einheiten: Strecken in Metern, Zeiten in Sekunden, Pace in s/km
--
-- Schreibzugriff:
--   - Pläne, Phasen und Einheiten legt ausschließlich die Edge Function an.
--     Sie prüft die KI-Ausgabe (Schema + Sicherheitsgrenzen) und schreibt
--     dann mit dem Secret Key, der RLS umgeht. user_id übernimmt sie aus
--     dem geprüften JWT, nie aus dem Request-Body.
--   - Der Client darf die Tabellen nur lesen. Seine einzigen Änderungen
--     laufen über die RPCs activate_training_plan und set_session_status.
--
-- Historie: Pläne werden nie gelöscht. Ein abgelöster Plan bekommt den
-- Status 'superseded' und behält Phasen und Einheiten als Snapshot.
-- Ein verworfener Entwurf (neu generiert) bekommt den Status 'discarded'.
-- =====================================================================


-- =====================================================================
-- Enums
-- =====================================================================
create type public.plan_status    as enum ('draft', 'active', 'superseded', 'discarded');
create type public.plan_source    as enum ('ai', 'manual');
create type public.session_type   as enum ('easy', 'long', 'tempo', 'interval', 'rest', 'race');
-- Nur Fakten, keine Bewertung: „verpasst“ wäre eine Interpretation
create type public.session_status as enum ('planned', 'completed', 'skipped');


-- =====================================================================
-- training_plans: ein Plan pro Generierung, gehört zu einem Ziel
-- =====================================================================
create table public.training_plans (
  training_plan_id  uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (user_id) on delete cascade,
  goal_id           uuid not null references public.goals (goal_id) on delete cascade,
  status            public.plan_status not null default 'draft',
  source            public.plan_source not null,
  activated_at      timestamptz,
  superseded_at     timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Aktive und abgelöste Pläne wissen, seit wann
  constraint training_plans_activated_at_set
    check (status not in ('active', 'superseded') or activated_at is not null),
  constraint training_plans_superseded_at_set
    check (status <> 'superseded' or superseded_at is not null),

  -- Ziel für die zusammengesetzten Fremdschlüssel der Kind-Tabellen:
  -- So gehört jede Phase und Einheit demselben Nutzer wie ihr Plan.
  constraint training_plans_id_user_unique unique (training_plan_id, user_id)
);

-- Höchstens ein aktiver Plan pro Nutzer
create unique index training_plans_one_active_per_user
  on public.training_plans (user_id)
  where status = 'active';

create index training_plans_user_created_idx on public.training_plans (user_id, created_at desc);
create index training_plans_goal_id_idx on public.training_plans (goal_id);

create trigger training_plans_set_updated_at
  before update on public.training_plans
  for each row execute function public.set_updated_at();


-- =====================================================================
-- plan_phases: Phasenübersicht eines Plans
-- =====================================================================
create table public.plan_phases (
  plan_phase_id     uuid primary key default gen_random_uuid(),
  training_plan_id  uuid not null,
  user_id           uuid not null,
  -- Reihenfolge innerhalb des Plans, beginnt bei 1
  position          smallint not null check (position >= 1),
  name              text not null check (char_length(name) between 1 and 100),
  focus             text check (char_length(focus) <= 500),
  start_date        date not null,
  end_date          date not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint plan_phases_dates_ordered check (end_date >= start_date),
  constraint plan_phases_unique_position unique (training_plan_id, position),

  constraint plan_phases_plan_fkey
    foreign key (training_plan_id, user_id)
    references public.training_plans (training_plan_id, user_id) on delete cascade,

  -- Ziel für den zusammengesetzten Fremdschlüssel aus plan_sessions
  constraint plan_phases_id_plan_unique unique (plan_phase_id, training_plan_id)
);

create index plan_phases_user_id_idx on public.plan_phases (user_id);

create trigger plan_phases_set_updated_at
  before update on public.plan_phases
  for each row execute function public.set_updated_at();


-- =====================================================================
-- plan_sessions: konkrete Einheiten (Soll); activity_id verknüpft
-- später den tatsächlich gelaufenen Lauf (Ist)
-- =====================================================================
create table public.plan_sessions (
  plan_session_id           uuid primary key default gen_random_uuid(),
  training_plan_id          uuid not null,
  -- optional: Einheit ohne Phasenzuordnung ist erlaubt
  plan_phase_id             uuid,
  user_id                   uuid not null,
  session_date              date not null,
  session_type              public.session_type not null,
  target_distance_m         integer check (target_distance_m > 0),
  target_duration_s         integer check (target_duration_s > 0),
  -- Pace-Bereich: min ist die schnellere Pace (kleinere Zahl)
  target_pace_min_s_per_km  integer check (target_pace_min_s_per_km > 0),
  target_pace_max_s_per_km  integer check (target_pace_max_s_per_km > 0),
  description               text check (char_length(description) <= 500),
  status                    public.session_status not null default 'planned',
  activity_id               uuid unique references public.activities (activity_id) on delete set null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  -- Ruhetage haben keine Zielwerte, alle anderen Einheiten mindestens Strecke oder Dauer
  constraint plan_sessions_rest_without_targets
    check (session_type <> 'rest' or num_nonnulls(
      target_distance_m, target_duration_s, target_pace_min_s_per_km, target_pace_max_s_per_km
    ) = 0),
  constraint plan_sessions_has_distance_or_duration
    check (session_type = 'rest' or num_nonnulls(target_distance_m, target_duration_s) >= 1),

  -- Pace-Bereich nur vollständig und in der richtigen Reihenfolge
  constraint plan_sessions_pace_range_complete
    check ((target_pace_min_s_per_km is null) = (target_pace_max_s_per_km is null)),
  constraint plan_sessions_pace_range_ordered
    check (target_pace_min_s_per_km <= target_pace_max_s_per_km),

  constraint plan_sessions_plan_fkey
    foreign key (training_plan_id, user_id)
    references public.training_plans (training_plan_id, user_id) on delete cascade,

  -- Die Phase muss zum selben Plan gehören (bei plan_phase_id = null keine Prüfung)
  constraint plan_sessions_phase_fkey
    foreign key (plan_phase_id, training_plan_id)
    references public.plan_phases (plan_phase_id, training_plan_id) on delete cascade
);

create index plan_sessions_plan_date_idx on public.plan_sessions (training_plan_id, session_date);
create index plan_sessions_user_date_idx on public.plan_sessions (user_id, session_date);

create trigger plan_sessions_set_updated_at
  before update on public.plan_sessions
  for each row execute function public.set_updated_at();


-- =====================================================================
-- Row Level Security: nur lesen, nur eigene Zeilen.
-- Keine Insert-, Update- oder Delete-Policies: Schreiben darf nur die
-- Edge Function (Secret Key) bzw. die RPCs unten.
-- =====================================================================
alter table public.training_plans enable row level security;
alter table public.plan_phases    enable row level security;
alter table public.plan_sessions  enable row level security;

create policy "Users can read own training plans"
  on public.training_plans for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read own plan phases"
  on public.plan_phases for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read own plan sessions"
  on public.plan_sessions for select to authenticated
  using ((select auth.uid()) = user_id);


-- =====================================================================
-- RPC activate_training_plan: Der Nutzer übernimmt einen Entwurf.
-- In einer Transaktion: bisher aktiver Plan → 'superseded',
-- übrige Entwürfe → 'discarded', gewählter Entwurf → 'active'.
-- security definer, weil der Client keine Update-Rechte hat; deshalb
-- prüft die Funktion selbst über auth.uid(), dass der Plan dem Nutzer gehört.
-- =====================================================================
create function public.activate_training_plan(p_training_plan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_plan    public.training_plans%rowtype;
begin
  if v_user_id is null then
    raise exception 'Nicht angemeldet';
  end if;

  -- Zeile sperren, damit zwei gleichzeitige Aufrufe sich nicht überholen
  select * into v_plan
    from public.training_plans
    where training_plan_id = p_training_plan_id
      and user_id = v_user_id
    for update;

  if not found then
    raise exception 'Plan nicht gefunden';
  end if;

  if v_plan.status <> 'draft' then
    raise exception 'Nur Entwürfe können übernommen werden';
  end if;

  if not exists (
    select 1 from public.goals g
    where g.goal_id = v_plan.goal_id and g.is_active
  ) then
    raise exception 'Der Plan gehört nicht zum aktiven Ziel';
  end if;

  update public.training_plans
    set status = 'superseded', superseded_at = now()
    where user_id = v_user_id and status = 'active';

  update public.training_plans
    set status = 'discarded'
    where user_id = v_user_id and status = 'draft'
      and training_plan_id <> p_training_plan_id;

  update public.training_plans
    set status = 'active', activated_at = now()
    where training_plan_id = p_training_plan_id;
end;
$$;

revoke execute on function public.activate_training_plan from public, anon;
grant execute on function public.activate_training_plan to authenticated;


-- =====================================================================
-- RPC set_session_status: Der Nutzer setzt den Status einer eigenen
-- Einheit (planned / completed / skipped), sonst nichts.
-- Nur Einheiten des aktiven Plans: Abgelöste Pläne bleiben als
-- Historie unverändert.
-- =====================================================================
create function public.set_session_status(
  p_plan_session_id  uuid,
  p_status           public.session_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Nicht angemeldet';
  end if;

  if p_status is null then
    raise exception 'Status fehlt';
  end if;

  update public.plan_sessions s
    set status = p_status
    from public.training_plans p
    where s.plan_session_id = p_plan_session_id
      and s.user_id = v_user_id
      and p.training_plan_id = s.training_plan_id
      and p.status = 'active';

  if not found then
    raise exception 'Einheit nicht gefunden oder nicht im aktiven Plan';
  end if;
end;
$$;

revoke execute on function public.set_session_status from public, anon;
grant execute on function public.set_session_status to authenticated;
