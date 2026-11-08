-- Interest groups. Public groups can be found and joined by anyone. Private
-- groups are hidden and joined with an invite code the owner shares.
--
-- Both tables are only reachable through the functions below (RLS is on with
-- no policies), so private groups, invite codes and member lists can't be read
-- directly. Members only ever see each other's "safe" profile fields.

begin;

-- The tags people can pick, shared with users.tags. Must match
-- TAG_GROUPS in frontend/src/profileOptions.ts.
create function public.allowed_tags()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array[
    'first_layoff', 'early_career', 'career_change', 'returning',
    'remote', 'relocating', 'freelance', 'own_business', 'back_to_school',
    'parent_caregiver', 'newcomer', 'health',
    'accountability', 'interview_practice', 'resume_help', 'networking',
    'someone_to_talk_to'
  ]::text[];
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 3 and 60),
  description text check (length(description) <= 1000),
  visibility text not null default 'public'
    check (visibility in ('public', 'private')),
  tags text[] not null default '{}'
    check (tags <@ public.allowed_tags() and cardinality(tags) <= 5),
  -- 10 hex characters from a random UUID. Only owners can see it.
  invite_code text not null unique
    default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  created_by text references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index groups_public_idx on public.groups (visibility, created_at desc);
create index groups_tags_idx on public.groups using gin (tags);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index group_members_user_idx on public.group_members (user_id);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
revoke all on public.groups, public.group_members from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- The signed-in person's role in a group, or null if they aren't in it.
create function public.my_group_role(target_group uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select m.role
  from public.group_members as m
  where m.group_id = target_group
    and m.user_id = (select auth.jwt() ->> 'sub');
$$;

-- Raises unless the signed-in person owns the group.
create function public.require_group_owner(target_group uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.my_group_role(target_group) is distinct from 'owner' then
    raise exception 'Only the group owner can do that';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reading groups
-- ---------------------------------------------------------------------------

-- Every public group, plus the private groups the person belongs to.
create function public.list_groups()
returns table (
  id uuid,
  name text,
  description text,
  visibility text,
  tags text[],
  member_count int,
  my_role text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select g.id, g.name, g.description, g.visibility, g.tags,
         (select count(*)::int from public.group_members as c where c.group_id = g.id),
         mine.role,
         g.created_at
  from public.groups as g
  left join public.group_members as mine
    on mine.group_id = g.id and mine.user_id = (select auth.jwt() ->> 'sub')
  where g.visibility = 'public' or mine.user_id is not null
  order by (mine.user_id is not null) desc, 6 desc, g.created_at desc;
$$;

-- One group, if the person may see it. invite_code is only filled in for the
-- owner.
create function public.get_group(target_group uuid)
returns table (
  id uuid,
  name text,
  description text,
  visibility text,
  tags text[],
  member_count int,
  my_role text,
  invite_code text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_role text := public.my_group_role(target_group);
begin
  return query
  select g.id, g.name, g.description, g.visibility, g.tags,
         (select count(*)::int from public.group_members as c where c.group_id = g.id),
         caller_role,
         case when caller_role = 'owner' then g.invite_code end,
         g.created_at
  from public.groups as g
  where g.id = target_group
    and (g.visibility = 'public' or caller_role is not null);

  if not found then
    raise exception 'Group not found';
  end if;
end;
$$;

create function public.get_group_members(target_group uuid)
returns table (
  user_id text,
  display_name text,
  field text,
  experience_level text,
  city text,
  role text,
  joined_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.groups as g
    where g.id = target_group
      and (g.visibility = 'public' or public.my_group_role(target_group) is not null)
  ) then
    raise exception 'Group not found';
  end if;

  return query
  select u.id, u.display_name, u.field, u.experience_level, u.city,
         m.role, m.joined_at
  from public.group_members as m
  join public.users as u on u.id = m.user_id
  where m.group_id = target_group
  order by (m.role = 'owner') desc, m.joined_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- Creating and editing groups
-- ---------------------------------------------------------------------------

create function public.create_group(
  new_name text,
  new_description text,
  new_visibility text,
  new_tags text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id text := auth.jwt() ->> 'sub';
  new_group_id uuid;
begin
  if not exists (
    select 1 from public.users as u
    where u.id = current_user_id and u.onboarded_at is not null
  ) then
    raise exception 'Finish setting up your account first';
  end if;

  insert into public.groups (name, description, visibility, tags, created_by)
  values (
    trim(new_name),
    nullif(trim(new_description), ''),
    new_visibility,
    coalesce(new_tags, '{}'),
    current_user_id
  )
  returning id into new_group_id;

  insert into public.group_members (group_id, user_id, role)
  values (new_group_id, current_user_id, 'owner');

  return new_group_id;
end;
$$;

create function public.update_group(
  target_group uuid,
  new_name text,
  new_description text,
  new_visibility text,
  new_tags text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_group_owner(target_group);

  update public.groups
  set name = trim(new_name),
      description = nullif(trim(new_description), ''),
      visibility = new_visibility,
      tags = coalesce(new_tags, '{}'),
      updated_at = now()
  where id = target_group;
end;
$$;

create function public.regenerate_invite_code(target_group uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_code text;
begin
  perform public.require_group_owner(target_group);

  update public.groups
  set invite_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  where id = target_group
  returning invite_code into new_code;

  return new_code;
end;
$$;

create function public.delete_group(target_group uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_group_owner(target_group);
  delete from public.groups where id = target_group;
end;
$$;

-- ---------------------------------------------------------------------------
-- Joining and leaving
-- ---------------------------------------------------------------------------

create function public.join_group(target_group uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id text := auth.jwt() ->> 'sub';
begin
  if not exists (
    select 1 from public.groups as g
    where g.id = target_group and g.visibility = 'public'
  ) then
    raise exception 'Group not found';
  end if;

  insert into public.group_members (group_id, user_id)
  values (target_group, current_user_id)
  on conflict do nothing;
end;
$$;

-- Works for public and private groups. Returns the group's id.
create function public.join_group_by_code(code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id text := auth.jwt() ->> 'sub';
  found_group uuid;
begin
  select g.id into found_group
  from public.groups as g
  where g.invite_code = upper(trim(code));

  if found_group is null then
    raise exception 'That invite code didn''t match a group';
  end if;

  insert into public.group_members (group_id, user_id)
  values (found_group, current_user_id)
  on conflict do nothing;

  return found_group;
end;
$$;

-- If the owner leaves, the longest-standing member becomes owner. If nobody
-- is left, the group is deleted.
create function public.leave_group(target_group uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id text := auth.jwt() ->> 'sub';
  was_owner boolean := coalesce(public.my_group_role(target_group) = 'owner', false);
  next_owner text;
begin
  delete from public.group_members
  where group_id = target_group and user_id = current_user_id;

  if not was_owner then
    return;
  end if;

  select m.user_id into next_owner
  from public.group_members as m
  where m.group_id = target_group
  order by m.joined_at
  limit 1;

  if next_owner is null then
    delete from public.groups where id = target_group;
  else
    update public.group_members
    set role = 'owner'
    where group_id = target_group and user_id = next_owner;
  end if;
end;
$$;

create function public.remove_group_member(target_group uuid, member text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_group_owner(target_group);

  if member = (select auth.jwt() ->> 'sub') then
    raise exception 'Use "Leave group" to leave your own group';
  end if;

  delete from public.group_members
  where group_id = target_group and user_id = member;
end;
$$;

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------

revoke all on function public.my_group_role(uuid) from public, anon, authenticated;
revoke all on function public.require_group_owner(uuid) from public, anon, authenticated;

revoke all on function public.list_groups() from public, anon;
revoke all on function public.get_group(uuid) from public, anon;
revoke all on function public.get_group_members(uuid) from public, anon;
revoke all on function public.create_group(text, text, text, text[]) from public, anon;
revoke all on function public.update_group(uuid, text, text, text, text[]) from public, anon;
revoke all on function public.regenerate_invite_code(uuid) from public, anon;
revoke all on function public.delete_group(uuid) from public, anon;
revoke all on function public.join_group(uuid) from public, anon;
revoke all on function public.join_group_by_code(text) from public, anon;
revoke all on function public.leave_group(uuid) from public, anon;
revoke all on function public.remove_group_member(uuid, text) from public, anon;

grant execute on function public.list_groups() to authenticated;
grant execute on function public.get_group(uuid) to authenticated;
grant execute on function public.get_group_members(uuid) to authenticated;
grant execute on function public.create_group(text, text, text, text[]) to authenticated;
grant execute on function public.update_group(uuid, text, text, text, text[]) to authenticated;
grant execute on function public.regenerate_invite_code(uuid) to authenticated;
grant execute on function public.delete_group(uuid) to authenticated;
grant execute on function public.join_group(uuid) to authenticated;
grant execute on function public.join_group_by_code(text) to authenticated;
grant execute on function public.leave_group(uuid) to authenticated;
grant execute on function public.remove_group_member(uuid, text) to authenticated;

commit;
