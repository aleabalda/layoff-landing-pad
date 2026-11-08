-- Moves user identity from Supabase Auth to Auth0.
--
-- Auth0 user IDs look like 'auth0|abc123', so they can't be stored as uuid or
-- read with auth.uid(), and Auth0 users have no row in auth.users. User ID
-- columns become text, and the signed-in user now comes from the JWT's `sub`.
--
-- Existing rows are kept, but their IDs are old Supabase Auth IDs, so Auth0
-- logins won't match them.

begin;

-- ---------------------------------------------------------------------------
-- Remove what depends on the old IDs
-- ---------------------------------------------------------------------------

-- `if exists` so this works even if a database differs from the first migration.
-- If something else still depends on the old columns, the type changes below
-- fail and the whole migration rolls back.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Its return type changes, which `create or replace` can't do.
drop function if exists public.get_crew_members();

drop policy if exists "Users can view their own row" on public.users;
drop policy if exists "Users can update their own row" on public.users;
drop policy if exists "Members can view their crew" on public.crews;
drop policy if exists "Users manage their own check-ins" on public.checkins;
drop policy if exists "Users manage their own tasks" on public.tasks;
drop policy if exists "Users manage their own story" on public.stories;
drop policy if exists "Members can view their crew's posts" on public.crew_posts;
drop policy if exists "Members can post to their crew" on public.crew_posts;
drop policy if exists "Users can delete their own posts" on public.crew_posts;
drop policy if exists "Members can report posts they can see" on public.crew_post_reports;
drop policy if exists "Users can view their own reports" on public.crew_post_reports;

alter table public.checkins drop constraint if exists checkins_user_id_fkey;
alter table public.tasks drop constraint if exists tasks_user_id_fkey;
alter table public.stories drop constraint if exists stories_user_id_fkey;
alter table public.crew_posts drop constraint if exists crew_posts_user_id_fkey;
alter table public.crew_post_reports drop constraint if exists crew_post_reports_reporter_id_fkey;
alter table public.users drop constraint if exists users_id_fkey;

-- ---------------------------------------------------------------------------
-- Change the columns
-- ---------------------------------------------------------------------------

alter table public.users alter column id type text using id::text;
alter table public.checkins alter column user_id type text using user_id::text;
alter table public.tasks alter column user_id type text using user_id::text;
alter table public.stories alter column user_id type text using user_id::text;
alter table public.crew_posts alter column user_id type text using user_id::text;
alter table public.crew_post_reports alter column reporter_id type text using reporter_id::text;

alter table public.checkins
  add constraint checkins_user_id_fkey
  foreign key (user_id) references public.users (id) on delete cascade;
alter table public.tasks
  add constraint tasks_user_id_fkey
  foreign key (user_id) references public.users (id) on delete cascade;
alter table public.stories
  add constraint stories_user_id_fkey
  foreign key (user_id) references public.users (id) on delete cascade;
alter table public.crew_posts
  add constraint crew_posts_user_id_fkey
  foreign key (user_id) references public.users (id) on delete cascade;
alter table public.crew_post_reports
  add constraint crew_post_reports_reporter_id_fkey
  foreign key (reporter_id) references public.users (id) on delete cascade;

-- ---------------------------------------------------------------------------
-- Row-level security, unchanged except for how the user is identified
-- ---------------------------------------------------------------------------

create policy "Users can view their own row"
  on public.users for select to authenticated
  using (id = (select auth.jwt() ->> 'sub'));
create policy "Users can update their own row"
  on public.users for update to authenticated
  using (id = (select auth.jwt() ->> 'sub'))
  with check (id = (select auth.jwt() ->> 'sub'));

create policy "Members can view their crew"
  on public.crews for select to authenticated
  using (id = (select crew_id from public.users where id = (select auth.jwt() ->> 'sub')));

create policy "Users manage their own check-ins"
  on public.checkins for all to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'))
  with check (user_id = (select auth.jwt() ->> 'sub'));

create policy "Users manage their own tasks"
  on public.tasks for all to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'))
  with check (user_id = (select auth.jwt() ->> 'sub'));

create policy "Users manage their own story"
  on public.stories for all to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'))
  with check (user_id = (select auth.jwt() ->> 'sub'));

create policy "Members can view their crew's posts"
  on public.crew_posts for select to authenticated
  using (crew_id = (select crew_id from public.users where id = (select auth.jwt() ->> 'sub')));
create policy "Members can post to their crew"
  on public.crew_posts for insert to authenticated
  with check (
    user_id = (select auth.jwt() ->> 'sub')
    and crew_id = (select crew_id from public.users where id = (select auth.jwt() ->> 'sub'))
  );
create policy "Users can delete their own posts"
  on public.crew_posts for delete to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'));

create policy "Members can report posts they can see"
  on public.crew_post_reports for insert to authenticated
  with check (
    reporter_id = (select auth.jwt() ->> 'sub')
    and exists (select 1 from public.crew_posts as p where p.id = post_id)
  );
create policy "Users can view their own reports"
  on public.crew_post_reports for select to authenticated
  using (reporter_id = (select auth.jwt() ->> 'sub'));

-- ---------------------------------------------------------------------------
-- Functions the app calls
-- ---------------------------------------------------------------------------

-- Replaces the sign-up trigger, which can't fire for Auth0 users. The app calls
-- this after login. It creates the user's row the first time, leaves an existing
-- row alone, and returns the saved display name.
create function public.ensure_user(new_display_name text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id text := auth.jwt() ->> 'sub';
  saved_display_name text;
begin
  if current_user_id is null then
    raise exception 'Not signed in';
  end if;

  insert into public.users (id, display_name)
  values (current_user_id, nullif(new_display_name, ''))
  on conflict (id) do nothing;

  select u.display_name
  into saved_display_name
  from public.users as u
  where u.id = current_user_id;

  return saved_display_name;
end;
$$;

revoke all on function public.ensure_user(text) from public, anon;
grant execute on function public.ensure_user(text) to authenticated;

create or replace function public.join_crew()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id text := auth.jwt() ->> 'sub';
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

-- Returns only what crewmates may see of each other.
create function public.get_crew_members()
returns table (user_id text, display_name text, field text)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.display_name, m.field
  from public.users as m
  where m.crew_id = (
    select u.crew_id from public.users as u where u.id = (select auth.jwt() ->> 'sub')
  )
  order by m.display_name;
$$;

revoke all on function public.get_crew_members() from public, anon;
grant execute on function public.get_crew_members() to authenticated;

commit;
