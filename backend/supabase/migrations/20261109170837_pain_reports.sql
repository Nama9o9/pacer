-- =====================================================================
-- Pacer – Beschwerden als eigene Tabelle
-- Mehrere Körperstellen pro Fragebogen, jede mit eigener Stärke.
-- Später nutzt auch der Check-in diese Tabelle (Spalte checkin_id).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Körperstellen als Enum
-- ---------------------------------------------------------------------
create type public.body_location as enum (
  'knee_left', 'knee_right', 'shin', 'achilles', 'calf', 'foot', 'hip', 'back', 'other'
);


-- ---------------------------------------------------------------------
-- 2. Tabelle pain_reports
-- Bewusst ohne updated_at: Momentaufnahme wie baselines.
-- ---------------------------------------------------------------------
create table public.pain_reports (
  pain_report_id  uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (user_id) on delete cascade,
  baseline_id     uuid references public.baselines (baseline_id) on delete cascade,
  location        public.body_location not null,
  level           smallint not null check (level between 0 and 10),
  created_at      timestamptz not null default now(),

  -- Jede Angabe gehört zu genau einer Quelle. Mit dem Check-in kommt
  -- checkin_id dazu, dann wird die Regel auf beide Spalten erweitert.
  constraint pain_reports_one_source check (num_nonnulls(baseline_id) = 1),

  -- Jede Körperstelle höchstens einmal pro Fragebogen
  constraint pain_reports_unique_location_per_baseline unique (baseline_id, location)
);

create index pain_reports_user_created_idx on public.pain_reports (user_id, created_at desc);

alter table public.pain_reports enable row level security;

create policy "Users can read own pain reports"
  on public.pain_reports for select to authenticated
  using ((select auth.uid()) = user_id);

-- Nur an eigene Fragebögen anhängen
create policy "Users can insert own pain reports"
  on public.pain_reports for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.baselines b
      where b.baseline_id = pain_reports.baseline_id
        and b.user_id = (select auth.uid())
    )
  );

create policy "Users can delete own pain reports"
  on public.pain_reports for delete to authenticated
  using ((select auth.uid()) = user_id);


-- ---------------------------------------------------------------------
-- 3. Alte Schmerzspalten aus baselines entfernen
-- ---------------------------------------------------------------------
alter table public.baselines drop constraint baselines_pain_complete;
alter table public.baselines drop column pain_location;
alter table public.baselines drop column pain_level;


-- ---------------------------------------------------------------------
-- 4. complete_onboarding neu anlegen
-- Die Parameter ändern sich, deshalb erst die alte Version löschen.
-- Sonst gäbe es zwei Funktionen mit gleichem Namen.
-- ---------------------------------------------------------------------
drop function public.complete_onboarding(
  integer, integer, date, smallint, numeric, numeric, integer, smallint, smallint[], text, smallint
);

-- p_pains: Liste wie [{"location": "knee_right", "level": 3}, …], leer ohne Beschwerden
create function public.complete_onboarding(
  p_distance_m            integer,
  p_target_time_s         integer,
  p_race_date             date,
  p_runs_per_week         smallint,
  p_km_per_week           numeric,
  p_longest_run_km        numeric,
  p_recent_5k_time_s      integer,
  p_running_since_months  smallint,
  p_available_days        smallint[],
  p_pains                 jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id     uuid := (select auth.uid());
  v_goal_id     uuid;
  v_baseline_id uuid;
begin
  if v_user_id is null then
    raise exception 'Nicht angemeldet';
  end if;

  if p_race_date <= current_date then
    raise exception 'Das Wettkampfdatum muss in der Zukunft liegen';
  end if;

  -- Höchstens ein aktives Ziel pro Nutzer
  update public.goals
    set is_active = false
    where user_id = v_user_id and is_active;

  insert into public.goals (user_id, distance_m, target_time_s, race_date)
  values (v_user_id, p_distance_m, p_target_time_s, p_race_date)
  returning goal_id into v_goal_id;

  insert into public.baselines (
    user_id, runs_per_week, km_per_week, longest_run_km, recent_5k_time_s,
    running_since_months, available_days
  )
  values (
    v_user_id, p_runs_per_week, p_km_per_week, p_longest_run_km, p_recent_5k_time_s,
    p_running_since_months, p_available_days
  )
  returning baseline_id into v_baseline_id;

  -- Jede Beschwerde als eigene Zeile; ungültige Werte lassen die
  -- ganze Funktion fehlschlagen, dann wird nichts gespeichert
  insert into public.pain_reports (user_id, baseline_id, location, level)
  select v_user_id, v_baseline_id, p.location, p.level
  from jsonb_to_recordset(p_pains) as p(location public.body_location, level smallint);

  return v_goal_id;
end;
$$;

revoke execute on function public.complete_onboarding from public, anon;
grant execute on function public.complete_onboarding to authenticated;