-- =====================================================================
-- Pacer – Check-in nach dem Lauf (FA#0108)
-- Erfasst empfundene Anstrengung (RPE), Stimmung, Motivation und
-- Beschwerden. Nur Daten, keine Bewertung: Die Interpretation
-- übernimmt ab M2 das LLM.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabelle checkins
-- Ein Check-in pro Lauf. Bewusst ohne updated_at: Momentaufnahme.
-- ---------------------------------------------------------------------
create table public.checkins (
  checkin_id   uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (user_id) on delete cascade,
  activity_id  uuid not null unique references public.activities (activity_id) on delete cascade,
  -- Borg CR-10: 0 = Ruhe, 10 = maximal
  rpe          smallint not null check (rpe between 0 and 10),
  mood         smallint not null check (mood between 1 and 5),
  motivation   smallint not null check (motivation between 1 and 5),
  note         text check (char_length(note) <= 500),
  created_at   timestamptz not null default now()
);

create index checkins_user_created_idx on public.checkins (user_id, created_at desc);

alter table public.checkins enable row level security;

create policy "Users can read own checkins"
  on public.checkins for select to authenticated
  using ((select auth.uid()) = user_id);

-- Nur zu eigenen Läufen
create policy "Users can insert own checkins"
  on public.checkins for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.activities a
      where a.activity_id = checkins.activity_id
        and a.user_id = (select auth.uid())
    )
  );

create policy "Users can delete own checkins"
  on public.checkins for delete to authenticated
  using ((select auth.uid()) = user_id);


-- ---------------------------------------------------------------------
-- 2. pain_reports: Beschwerden auch aus dem Check-in
-- Jede Angabe gehört weiterhin zu genau einer Quelle.
-- ---------------------------------------------------------------------
alter table public.pain_reports
  add column checkin_id uuid references public.checkins (checkin_id) on delete cascade;

alter table public.pain_reports drop constraint pain_reports_one_source;
alter table public.pain_reports
  add constraint pain_reports_one_source check (num_nonnulls(baseline_id, checkin_id) = 1);

-- Jede Körperstelle höchstens einmal pro Check-in
alter table public.pain_reports
  add constraint pain_reports_unique_location_per_checkin unique (checkin_id, location);

-- Insert-Regel um Check-ins erweitern
drop policy "Users can insert own pain reports" on public.pain_reports;

create policy "Users can insert own pain reports"
  on public.pain_reports for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      exists (
        select 1 from public.baselines b
        where b.baseline_id = pain_reports.baseline_id
          and b.user_id = (select auth.uid())
      )
      or exists (
        select 1 from public.checkins c
        where c.checkin_id = pain_reports.checkin_id
          and c.user_id = (select auth.uid())
      )
    )
  );


-- ---------------------------------------------------------------------
-- 3. save_checkin: Check-in und Beschwerden in einer Transaktion
-- p_pains: Liste wie [{"location": "knee_right", "level": 3}], leer ohne Beschwerden
-- ---------------------------------------------------------------------
create function public.save_checkin(
  p_activity_id  uuid,
  p_rpe          smallint,
  p_mood         smallint,
  p_motivation   smallint,
  p_note         text default null,
  p_pains        jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id    uuid := (select auth.uid());
  v_checkin_id uuid;
begin
  if v_user_id is null then
    raise exception 'Nicht angemeldet';
  end if;

  insert into public.checkins (user_id, activity_id, rpe, mood, motivation, note)
  values (v_user_id, p_activity_id, p_rpe, p_mood, p_motivation, nullif(trim(p_note), ''))
  returning checkin_id into v_checkin_id;

  -- Ungültige Werte lassen die ganze Funktion fehlschlagen, dann wird nichts gespeichert
  insert into public.pain_reports (user_id, checkin_id, location, level)
  select v_user_id, v_checkin_id, p.location, p.level
  from jsonb_to_recordset(p_pains) as p(location public.body_location, level smallint);

  return v_checkin_id;
end;
$$;

revoke execute on function public.save_checkin from public, anon;
grant execute on function public.save_checkin to authenticated;
