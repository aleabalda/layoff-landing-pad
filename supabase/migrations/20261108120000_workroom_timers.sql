-- A shared focus timer for each crew's workroom. Everyone in the crew sees the
-- same countdown, in the workroom, the crew chat and the crew page.
--
-- One row per crew. Stopping keeps the row with ends_at = null rather than
-- deleting it, because Supabase Realtime can't filter delete events.

begin;

create table public.workroom_timers (
  crew_id uuid primary key references public.crews (id) on delete cascade,
  mode text not null check (mode in ('focus', 'break')),
  duration_minutes smallint not null check (duration_minutes between 1 and 180),
  -- Null when the timer is stopped.
  ends_at timestamptz,
  started_by text references public.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.workroom_timers enable row level security;

-- Readable by crew members, so Realtime can send them changes live.
create policy "Crew members can see their workroom timer"
  on public.workroom_timers for select to authenticated
  using (public.is_crew_member(crew_id));

-- Changes only go through the functions below.
revoke insert, update, delete on public.workroom_timers from anon, authenticated;

alter publication supabase_realtime add table public.workroom_timers;

-- ---------------------------------------------------------------------------
-- Functions the app calls
-- ---------------------------------------------------------------------------

-- The crew's timer with the name of whoever last started or stopped it.
-- No row means a timer has never been used in this crew.
create function public.get_workroom_timer(target_crew uuid)
returns table (
  mode text,
  duration_minutes smallint,
  ends_at timestamptz,
  started_by_name text,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_crew_member(target_crew) then
    raise exception 'Join the crew to use its workroom';
  end if;

  return query
  select t.mode, t.duration_minutes, t.ends_at, u.display_name, t.updated_at
  from public.workroom_timers as t
  left join public.users as u on u.id = t.started_by
  where t.crew_id = target_crew;
end;
$$;

-- Starts (or restarts) the crew's timer. Any crew member can.
create function public.start_workroom_timer(
  target_crew uuid,
  new_mode text,
  minutes int
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_crew_member(target_crew) then
    raise exception 'Join the crew to use its workroom';
  end if;

  insert into public.workroom_timers
    (crew_id, mode, duration_minutes, ends_at, started_by, updated_at)
  values (
    target_crew, new_mode, minutes,
    now() + make_interval(mins => minutes),
    (select auth.jwt() ->> 'sub'), now()
  )
  on conflict (crew_id) do update set
    mode = excluded.mode,
    duration_minutes = excluded.duration_minutes,
    ends_at = excluded.ends_at,
    started_by = excluded.started_by,
    updated_at = excluded.updated_at;
end;
$$;

create function public.stop_workroom_timer(target_crew uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_crew_member(target_crew) then
    raise exception 'Join the crew to use its workroom';
  end if;

  update public.workroom_timers
  set ends_at = null,
      started_by = (select auth.jwt() ->> 'sub'),
      updated_at = now()
  where crew_id = target_crew;
end;
$$;

revoke all on function public.get_workroom_timer(uuid) from public, anon;
revoke all on function public.start_workroom_timer(uuid, text, int) from public, anon;
revoke all on function public.stop_workroom_timer(uuid) from public, anon;
grant execute on function public.get_workroom_timer(uuid) to authenticated;
grant execute on function public.start_workroom_timer(uuid, text, int) to authenticated;
grant execute on function public.stop_workroom_timer(uuid) to authenticated;

commit;
