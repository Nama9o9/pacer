-- =====================================================================
-- Pacer – Coach-Chat (Meilenstein 2)
-- Tabelle coach_messages: Verlauf zwischen Nutzer und KI-Coach
--
-- Schreibzugriff:
--   - Alle Nachrichten schreibt ausschließlich die Edge Function, auch die
--     Nachrichten des Nutzers. So landet nichts im Verlauf (und damit im
--     Kontext der KI), das nicht über die Function gelaufen ist.
--   - Die Function schreibt mit dem Secret Key, der RLS umgeht. user_id
--     übernimmt sie aus dem geprüften JWT, nie aus dem Request-Body.
--   - Der Client darf die Tabelle nur lesen.
--
-- Embeddings für das Gedächtnis (pgvector) folgen in einer späteren Migration.
-- =====================================================================

create type public.chat_role as enum ('user', 'assistant');

create table public.coach_messages (
  coach_message_id  uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (user_id) on delete cascade,
  role              public.chat_role not null,
  -- Leere oder nur aus Leerzeichen bestehende Nachrichten sind nicht erlaubt
  content           text not null check (char_length(btrim(content)) > 0 and char_length(content) <= 4000),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Verlauf eines Nutzers chronologisch laden (neueste zuerst)
create index coach_messages_user_created_idx on public.coach_messages (user_id, created_at desc);

create trigger coach_messages_set_updated_at
  before update on public.coach_messages
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- Row Level Security: nur lesen, nur eigene Nachrichten.
-- Keine Insert-, Update- oder Delete-Policies (siehe oben).
-- ---------------------------------------------------------------------
alter table public.coach_messages enable row level security;

create policy "Users can read own coach messages"
  on public.coach_messages for select to authenticated
  using ((select auth.uid()) = user_id);
