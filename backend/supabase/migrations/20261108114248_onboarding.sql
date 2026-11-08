-- =====================================================================
-- Pacer – Onboarding
-- Funktion complete_onboarding: schreibt Ziel und Basis gemeinsam
-- =====================================================================

-- Läuft als aufrufender Nutzer (security invoker), damit die
-- RLS-Policies weiter gelten. Alles in einer Transaktion: Schlägt
-- ein Insert fehl, wird nichts gespeichert.
-- Ein bestehendes aktives Ziel wird vorher deaktiviert.
create or replace function public.complete_onboarding(
  p_distance_m            integer,
  p_target_time_s         integer,
  p_race_date             date,
  p_runs_per_week         smallint,
  p_km_per_week           numeric,
  p_longest_run_km        numeric,
  p_recent_5k_time_s      integer,
  p_running_since_months  smallint,
  p_available_days        smallint[],
  p_pain_location         text     default null,
  p_pain_level            smallint default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_goal_id uuid;
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
    running_since_months, available_days, pain_location, pain_level
  )
  values (
    v_user_id, p_runs_per_week, p_km_per_week, p_longest_run_km, p_recent_5k_time_s,
    p_running_since_months, p_available_days, p_pain_location, p_pain_level
  );

  return v_goal_id;
end;
$$;

-- Nur angemeldete Nutzer dürfen die Funktion aufrufen
revoke execute on function public.complete_onboarding from public, anon;
grant execute on function public.complete_onboarding to authenticated;