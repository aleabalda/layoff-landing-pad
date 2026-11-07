-- Replaces the original profiles/friends/skills/resumes schema with the
-- Landing Pad data model.
--
-- DESTRUCTIVE: this permanently deletes all rows in profiles, friendships,
-- skills, user_skills and resumes. Accounts in auth.users are kept.

begin;

-- ---------------------------------------------------------------------------
-- Remove the old schema
-- ---------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;

drop function if exists public.find_skill_matches(integer);

drop table if exists
  public.resumes,
  public.user_skills,
  public.skills,
  public.friendships,
  public.profiles;

drop function if exists public.handle_new_user();
drop function if exists public.prevent_friendship_party_changes();
drop function if exists public.set_updated_at();

-- The `resumes` bucket is left in place: Supabase blocks deleting buckets with
-- SQL. Without these policies, signed-in users can no longer reach its files.
-- Delete the bucket from the dashboard (Storage) when you no longer need it.
drop policy if exists "Users can upload their own resume files" on storage.objects;
drop policy if exists "Users can view their own resume files" on storage.objects;
drop policy if exists "Users can update their own resume files" on storage.objects;
drop policy if exists "Users can delete their own resume files" on storage.objects;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.crews (
  id uuid primary key default gen_random_uuid(),
  field text not null,
  start_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index crews_field_idx on public.crews (lower(field), start_date desc);

-- Onboarding columns stay null until the intake is finished.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  job_end_reason text
    check (job_end_reason in ('laid_off', 'let_go', 'quit', 'complicated')),
  initial_feeling text
    check (initial_feeling in ('overwhelmed', 'okay', 'hopeful')),
  urgent_need text
    check (urgent_need in ('money', 'next_job', 'mental_health', 'figuring_out')),
  field text,
  experience_level text,
  city text,
  crew_id uuid references public.crews (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index users_crew_idx on public.users (crew_id);

-- One check-in per user per day. The client sends `date` in the user's local
-- time, because the database clock is UTC and an evening check-in in Alberta
-- would otherwise land on the next day.
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  date date not null,
  mood smallint not null check (mood between 1 and 5),
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- Holds both 30-day plan tasks and first-week checklist items.
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  week smallint not null check (week between 1 and 4),
  title text not null,
  energy_level text not null default 'medium'
    check (energy_level in ('low', 'medium', 'high')),
  is_checklist boolean not null default false,
  link_url text,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create index tasks_user_week_idx on public.tasks (user_id, week);

create table public.stories (
  user_id uuid primary key references public.users (id) on delete cascade,
  private_reflection text,
  public_answer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Check-ins are private. Sharing one with the crew means posting it here as
-- type 'check_in', and the "Crew pulse" count comes from those posts.
create table public.crew_posts (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  content text not null check (length(trim(content)) > 0),
  type text not null check (type in ('win', 'question', 'check_in')),
  created_at timestamptz not null default now()
);

create index crew_posts_crew_created_idx
  on public.crew_posts (crew_id, created_at desc);

-- Backs the report button. Review reports from the Supabase dashboard.
create table public.crew_post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.crew_posts (id) on delete cascade,
  reporter_id uuid not null references public.users (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger stories_set_updated_at
  before update on public.stories
  for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Accounts created under the old schema need a row too.
insert into public.users (id, display_name)
select id, nullif(raw_user_meta_data ->> 'full_name', '')
from auth.users;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.crews enable row level security;
alter table public.users enable row level security;
alter table public.checkins enable row level security;
alter table public.tasks enable row level security;
alter table public.stories enable row level security;
alter table public.crew_posts enable row level security;
alter table public.crew_post_reports enable row level security;

-- A users row includes how the job ended, so only its owner can read it.
-- Crewmates get names through get_crew_members() instead.
create policy "Users can view their own row"
  on public.users for select to authenticated
  using (id = (select auth.uid()));
create policy "Users can update their own row"
  on public.users for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- crew_id is left out so nobody can read another crew by pointing their row at
-- it. join_crew() is the only way in.
revoke update on public.users from anon, authenticated;
grant update (
  display_name,
  job_end_reason,
  initial_feeling,
  urgent_need,
  field,
  experience_level,
  city
) on public.users to authenticated;

create policy "Members can view their crew"
  on public.crews for select to authenticated
  using (id = (select crew_id from public.users where id = (select auth.uid())));

create policy "Users manage their own check-ins"
  on public.checkins for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users manage their own tasks"
  on public.tasks for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users manage their own story"
  on public.stories for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Members can view their crew's posts"
  on public.crew_posts for select to authenticated
  using (crew_id = (select crew_id from public.users where id = (select auth.uid())));
create policy "Members can post to their crew"
  on public.crew_posts for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and crew_id = (select crew_id from public.users where id = (select auth.uid()))
  );
create policy "Users can delete their own posts"
  on public.crew_posts for delete to authenticated
  using (user_id = (select auth.uid()));

-- The subquery runs under crew_posts' policy, so only visible posts qualify.
create policy "Members can report posts they can see"
  on public.crew_post_reports for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and exists (select 1 from public.crew_posts as p where p.id = post_id)
  );
create policy "Users can view their own reports"
  on public.crew_post_reports for select to authenticated
  using (reporter_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Functions the app calls
-- ---------------------------------------------------------------------------

-- Puts the signed-in user in a crew with the same field that started in the
-- last 30 days and has room (crews hold up to 6), or starts a new one.
create function public.join_crew()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  user_field text;
  assigned_crew_id uuid;
begin
  -- Serialize joins so two people can't both take a crew's last seat.
  perform pg_advisory_xact_lock(hashtext('public.join_crew'));

  select u.field, u.crew_id
  into user_field, assigned_crew_id
  from public.users as u
  where u.id = current_user_id;

  if not found then
    raise exception 'Not signed in';
  end if;

  if assigned_crew_id is not null then
    return assigned_crew_id;
  end if;

  if user_field is null then
    raise exception 'Set a field before joining a crew';
  end if;

  select c.id
  into assigned_crew_id
  from public.crews as c
  where lower(c.field) = lower(user_field)
    and c.start_date >= current_date - 30
    and (select count(*) from public.users as m where m.crew_id = c.id) < 6
  order by c.start_date desc, c.created_at
  limit 1;

  if assigned_crew_id is null then
    insert into public.crews (field)
    values (user_field)
    returning id into assigned_crew_id;
  end if;

  update public.users
  set crew_id = assigned_crew_id
  where id = current_user_id;

  return assigned_crew_id;
end;
$$;

revoke all on function public.join_crew() from public, anon;
grant execute on function public.join_crew() to authenticated;

-- Returns only what crewmates may see of each other.
create function public.get_crew_members()
returns table (user_id uuid, display_name text, field text)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.display_name, m.field
  from public.users as m
  where m.crew_id = (
    select u.crew_id from public.users as u where u.id = (select auth.uid())
  )
  order by m.display_name;
$$;

revoke all on function public.get_crew_members() from public, anon;
grant execute on function public.get_crew_members() to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime crew chat
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.crew_posts;

commit;
