-- Personal calendar events (interviews, deadlines, networking chats) for the
-- calendar on the Today page. Each person only ever sees their own.
--
-- event_date is the person's local date, sent by the app, like check-ins.
-- Kinds must match frontend/src/pages/Home/Calendar/calendarTypes.ts.

begin;

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub')
    references public.users (id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 120),
  kind text not null default 'other'
    check (kind in ('interview', 'deadline', 'networking', 'other')),
  event_date date not null,
  start_time time,
  notes text check (length(notes) <= 500),
  created_at timestamptz not null default now()
);

create index calendar_events_user_date_idx
  on public.calendar_events (user_id, event_date);

alter table public.calendar_events enable row level security;

create policy "Users manage their own calendar events"
  on public.calendar_events for all to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'))
  with check (user_id = (select auth.jwt() ->> 'sub'));

-- ---------------------------------------------------------------------------
-- "Excited" in the daily check-in
-- ---------------------------------------------------------------------------

-- Check-in moods were 1 (overwhelmed) to 5 (hopeful). 6 is excited. Must
-- match MOODS in frontend/src/pages/Home/Home.tsx.
alter table public.checkins drop constraint if exists checkins_mood_check;
alter table public.checkins
  add constraint checkins_mood_check check (mood between 1 and 6);

commit;
