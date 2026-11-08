-- Groups become crews.
--
-- The first migration had an automatic "crews" system (people matched by
-- field, up to 6 per crew, with crew_posts). The app never used it, and groups
-- now do that job, so this:
--
--   1. removes the old crews, crew_posts, crew_post_reports, users.crew_id,
--      join_crew() and get_crew_members()
--   2. renames groups -> crews, group_members -> crew_members and every
--      group_id column -> crew_id
--   3. recreates every function that mentioned groups under crew names, since
--      function bodies refer to tables by name
--
-- DESTRUCTIVE for the old crew tables, so it stops if they hold any rows.
-- Groups, members, messages and attachments are all kept.

begin;

-- ---------------------------------------------------------------------------
-- 0. Stop if the old crew tables have data
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.crew_posts') is not null
    and exists (select 1 from public.crew_posts) then
    raise exception 'public.crew_posts has rows. Back them up or delete them, then run this again.';
  end if;
  if to_regclass('public.crews') is not null
    and exists (select 1 from public.crews) then
    raise exception 'public.crews (the old automatic crews) has rows. Back them up or delete them, then run this again.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Remove the old automatic crews
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'crew_posts'
  ) then
    alter publication supabase_realtime drop table public.crew_posts;
  end if;
end;
$$;

drop function if exists public.join_crew();
drop function if exists public.get_crew_members();
drop table if exists public.crew_post_reports;
drop table if exists public.crew_posts;
-- cascade also removes the old crews policy that reads users.crew_id and the
-- foreign key to the old crews table.
alter table public.users drop column if exists crew_id cascade;
drop table if exists public.crews;

-- ---------------------------------------------------------------------------
-- 2. Drop everything that names groups, then rename the tables
-- ---------------------------------------------------------------------------

drop policy "People can read messages in their conversations" on public.messages;

drop function public.get_crew_pulse();
drop function public.get_conversations();
drop function public.mark_conversation_read(uuid, uuid);
drop function public.send_message(text, uuid, uuid, text, text);
drop function public.get_messages(uuid, uuid, timestamptz, int);
drop function public.get_direct_thread(uuid);
drop function public.require_conversation_access(uuid, uuid);
drop function public.is_group_member(uuid);
drop function public.remove_group_member(uuid, text);
drop function public.leave_group(uuid);
drop function public.join_group_by_code(text);
drop function public.join_group(uuid);
drop function public.delete_group(uuid);
drop function public.regenerate_invite_code(uuid);
drop function public.update_group(uuid, text, text, text, text[]);
drop function public.create_group(text, text, text, text[]);
drop function public.get_group_members(uuid);
drop function public.get_group(uuid);
drop function public.list_groups();
drop function public.require_group_owner(uuid);
drop function public.my_group_role(uuid);

alter table public.groups rename to crews;
alter index public.groups_pkey rename to crews_pkey;
alter index public.groups_invite_code_key rename to crews_invite_code_key;
alter index public.groups_public_idx rename to crews_public_idx;
alter index public.groups_tags_idx rename to crews_tags_idx;

alter table public.group_members rename to crew_members;
alter table public.crew_members rename column group_id to crew_id;
alter index public.group_members_pkey rename to crew_members_pkey;
alter index public.group_members_user_idx rename to crew_members_user_idx;

alter table public.messages rename column group_id to crew_id;
alter index public.messages_group_idx rename to messages_crew_idx;

-- ---------------------------------------------------------------------------
-- 3. Helpers
-- ---------------------------------------------------------------------------

-- The signed-in person's role in a crew, or null if they aren't in it.
create function public.my_crew_role(target_crew uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select m.role
  from public.crew_members as m
  where m.crew_id = target_crew
    and m.user_id = (select auth.jwt() ->> 'sub');
$$;

create function public.require_crew_owner(target_crew uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.my_crew_role(target_crew) is distinct from 'owner' then
    raise exception 'Only the crew owner can do that';
  end if;
end;
$$;

-- Used by the messages policy, so signed-in people can call it. It only ever
-- answers about the caller.
create function public.is_crew_member(target_crew uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.crew_members as m
    where m.crew_id = target_crew
      and m.user_id = (select auth.jwt() ->> 'sub')
  );
$$;

-- Raises unless the signed-in person can read this conversation. Exactly one
-- of the two ids must be given.
create function public.require_conversation_access(
  target_crew uuid,
  target_thread uuid
)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (target_crew is null) = (target_thread is null) then
    raise exception 'Pick one conversation';
  end if;

  if target_crew is not null and not public.is_crew_member(target_crew) then
    raise exception 'Join the crew to see its messages';
  end if;

  if target_thread is not null and not exists (
    select 1 from public.direct_threads as t
    where t.id = target_thread
      and (select auth.jwt() ->> 'sub') in (t.user_a, t.user_b)
  ) then
    raise exception 'Conversation not found';
  end if;
end;
$$;

create policy "People can read messages in their conversations"
  on public.messages for select to authenticated
  using (
    (crew_id is not null and public.is_crew_member(crew_id))
    or (
      thread_id is not null
      and exists (
        select 1 from public.direct_threads as t
        where t.id = thread_id
          and (select auth.jwt() ->> 'sub') in (t.user_a, t.user_b)
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Reading crews
-- ---------------------------------------------------------------------------

-- Every public crew, plus the private crews the person belongs to.
create function public.list_crews()
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
  select c.id, c.name, c.description, c.visibility, c.tags,
         (select count(*)::int from public.crew_members as n where n.crew_id = c.id),
         mine.role,
         c.created_at
  from public.crews as c
  left join public.crew_members as mine
    on mine.crew_id = c.id and mine.user_id = (select auth.jwt() ->> 'sub')
  where c.visibility = 'public' or mine.user_id is not null
  order by (mine.user_id is not null) desc, 6 desc, c.created_at desc;
$$;

-- One crew, if the person may see it. invite_code is only filled in for the
-- owner.
create function public.get_crew(target_crew uuid)
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
  caller_role text := public.my_crew_role(target_crew);
begin
  return query
  select c.id, c.name, c.description, c.visibility, c.tags,
         (select count(*)::int from public.crew_members as n where n.crew_id = c.id),
         caller_role,
         case when caller_role = 'owner' then c.invite_code end,
         c.created_at
  from public.crews as c
  where c.id = target_crew
    and (c.visibility = 'public' or caller_role is not null);

  if not found then
    raise exception 'Crew not found';
  end if;
end;
$$;

create function public.get_crew_members(target_crew uuid)
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
    select 1 from public.crews as c
    where c.id = target_crew
      and (c.visibility = 'public' or public.my_crew_role(target_crew) is not null)
  ) then
    raise exception 'Crew not found';
  end if;

  return query
  select u.id, u.display_name, u.field, u.experience_level, u.city,
         m.role, m.joined_at
  from public.crew_members as m
  join public.users as u on u.id = m.user_id
  where m.crew_id = target_crew
  order by (m.role = 'owner') desc, m.joined_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Creating and editing crews
-- ---------------------------------------------------------------------------

create function public.create_crew(
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
  new_crew_id uuid;
begin
  if not exists (
    select 1 from public.users as u
    where u.id = current_user_id and u.onboarded_at is not null
  ) then
    raise exception 'Finish setting up your account first';
  end if;

  insert into public.crews (name, description, visibility, tags, created_by)
  values (
    trim(new_name),
    nullif(trim(new_description), ''),
    new_visibility,
    coalesce(new_tags, '{}'),
    current_user_id
  )
  returning id into new_crew_id;

  insert into public.crew_members (crew_id, user_id, role)
  values (new_crew_id, current_user_id, 'owner');

  return new_crew_id;
end;
$$;

create function public.update_crew(
  target_crew uuid,
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
  perform public.require_crew_owner(target_crew);

  update public.crews
  set name = trim(new_name),
      description = nullif(trim(new_description), ''),
      visibility = new_visibility,
      tags = coalesce(new_tags, '{}'),
      updated_at = now()
  where id = target_crew;
end;
$$;

create function public.regenerate_invite_code(target_crew uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_code text;
begin
  perform public.require_crew_owner(target_crew);

  update public.crews
  set invite_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  where id = target_crew
  returning invite_code into new_code;

  return new_code;
end;
$$;

create function public.delete_crew(target_crew uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_crew_owner(target_crew);
  delete from public.crews where id = target_crew;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Joining and leaving
-- ---------------------------------------------------------------------------

create function public.join_crew(target_crew uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.crews as c
    where c.id = target_crew and c.visibility = 'public'
  ) then
    raise exception 'Crew not found';
  end if;

  insert into public.crew_members (crew_id, user_id)
  values (target_crew, auth.jwt() ->> 'sub')
  on conflict do nothing;
end;
$$;

-- Works for public and private crews. Returns the crew's id.
create function public.join_crew_by_code(code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  found_crew uuid;
begin
  select c.id into found_crew
  from public.crews as c
  where c.invite_code = upper(trim(code));

  if found_crew is null then
    raise exception 'That invite code didn''t match a crew';
  end if;

  insert into public.crew_members (crew_id, user_id)
  values (found_crew, auth.jwt() ->> 'sub')
  on conflict do nothing;

  return found_crew;
end;
$$;

-- If the owner leaves, the longest-standing member becomes owner. If nobody
-- is left, the crew is deleted.
create function public.leave_crew(target_crew uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id text := auth.jwt() ->> 'sub';
  was_owner boolean := coalesce(public.my_crew_role(target_crew) = 'owner', false);
  next_owner text;
begin
  delete from public.crew_members
  where crew_id = target_crew and user_id = current_user_id;

  if not was_owner then
    return;
  end if;

  select m.user_id into next_owner
  from public.crew_members as m
  where m.crew_id = target_crew
  order by m.joined_at
  limit 1;

  if next_owner is null then
    delete from public.crews where id = target_crew;
  else
    update public.crew_members
    set role = 'owner'
    where crew_id = target_crew and user_id = next_owner;
  end if;
end;
$$;

create function public.remove_crew_member(target_crew uuid, member text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_crew_owner(target_crew);

  if member = (select auth.jwt() ->> 'sub') then
    raise exception 'Use "Leave crew" to leave your own crew';
  end if;

  delete from public.crew_members
  where crew_id = target_crew and user_id = member;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Messages
-- ---------------------------------------------------------------------------

create function public.get_direct_thread(target_thread uuid)
returns table (other_user_id text, display_name text, can_send boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id text := auth.jwt() ->> 'sub';
begin
  perform public.require_conversation_access(null, target_thread);

  return query
  select o.id, o.display_name, public.are_friends(current_user_id, o.id)
  from public.direct_threads as t
  join public.users as o
    on o.id = case when t.user_a = current_user_id then t.user_b else t.user_a end
  where t.id = target_thread;
end;
$$;

-- Newest first. Pass `older_than` (the oldest created_at already loaded) to
-- page back through older messages.
create function public.get_messages(
  target_crew uuid default null,
  target_thread uuid default null,
  older_than timestamptz default null,
  max_results int default 50
)
returns table (
  id uuid,
  sender_id text,
  sender_name text,
  body text,
  attachment_path text,
  attachment_name text,
  attachment_type text,
  attachment_size bigint,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_conversation_access(target_crew, target_thread);

  return query
  select m.id, m.sender_id, u.display_name, m.body,
         m.attachment_path, m.attachment_name, m.attachment_type, m.attachment_size,
         m.created_at
  from public.messages as m
  left join public.users as u on u.id = m.sender_id
  where (target_crew is not null and m.crew_id = target_crew
         or target_thread is not null and m.thread_id = target_thread)
    and (older_than is null or m.created_at < older_than)
  order by m.created_at desc
  limit least(greatest(max_results, 1), 100);
end;
$$;

-- Upload any attachment to Storage first, then pass its path here.
create function public.send_message(
  message text,
  target_crew uuid default null,
  target_thread uuid default null,
  new_attachment_path text default null,
  new_attachment_name text default null
)
returns table (
  id uuid,
  sender_id text,
  sender_name text,
  body text,
  attachment_path text,
  attachment_name text,
  attachment_type text,
  attachment_size bigint,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id text := auth.jwt() ->> 'sub';
  other_user text;
  file_type text;
  file_size bigint;
begin
  perform public.require_conversation_access(target_crew, target_thread);

  if target_thread is not null then
    select case when t.user_a = current_user_id then t.user_b else t.user_a end
    into other_user
    from public.direct_threads as t
    where t.id = target_thread;

    if not public.are_friends(current_user_id, other_user) then
      raise exception 'You can only message friends';
    end if;
  end if;

  if new_attachment_path is not null then
    -- The file must be in this conversation's folder.
    if new_attachment_path not like
      (case when target_crew is not null
            then 'crew/' || target_crew
            else 'direct/' || target_thread end) || '/%' then
      raise exception 'That attachment doesn''t belong to this conversation';
    end if;

    select o.metadata ->> 'mimetype', (o.metadata ->> 'size')::bigint
    into file_type, file_size
    from storage.objects as o
    where o.bucket_id = 'message-attachments' and o.name = new_attachment_path;

    if not found then
      raise exception 'The attachment didn''t finish uploading';
    end if;
  end if;

  return query
  with inserted as (
    insert into public.messages (
      crew_id, thread_id, sender_id, body,
      attachment_path, attachment_name, attachment_type, attachment_size
    )
    values (
      target_crew, target_thread, current_user_id, trim(coalesce(message, '')),
      new_attachment_path,
      case when new_attachment_path is not null
           then left(coalesce(nullif(trim(new_attachment_name), ''), 'Attachment'), 200)
      end,
      file_type,
      file_size
    )
    returning messages.id, messages.sender_id, messages.body,
              messages.attachment_path, messages.attachment_name,
              messages.attachment_type, messages.attachment_size,
              messages.created_at
  )
  select i.id, i.sender_id, u.display_name, i.body,
         i.attachment_path, i.attachment_name, i.attachment_type, i.attachment_size,
         i.created_at
  from inserted as i
  left join public.users as u on u.id = i.sender_id;
end;
$$;

create function public.mark_conversation_read(
  target_crew uuid default null,
  target_thread uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id text := auth.jwt() ->> 'sub';
begin
  perform public.require_conversation_access(target_crew, target_thread);

  if target_crew is not null then
    update public.crew_members
    set last_read_at = now()
    where crew_id = target_crew and user_id = current_user_id;
  else
    update public.direct_threads
    set a_last_read_at = case when user_a = current_user_id then now() else a_last_read_at end,
        b_last_read_at = case when user_b = current_user_id then now() else b_last_read_at end
    where id = target_thread;
  end if;
end;
$$;

-- Every crew the person is in, plus direct threads that have messages, most
-- recent first. A message with only an attachment previews as "📎 file name".
create function public.get_conversations()
returns table (
  kind text,
  id uuid,
  title text,
  other_user_id text,
  last_message text,
  last_sender_id text,
  last_sender_name text,
  last_activity_at timestamptz,
  unread_count int
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (select (select auth.jwt() ->> 'sub') as id)
  select 'crew', c.id, c.name, null::text,
         last.preview, last.sender_id, last.sender_name,
         coalesce(last.created_at, m.joined_at),
         (select count(*)::int from public.messages as x
          where x.crew_id = c.id
            and x.created_at > m.last_read_at
            and x.sender_id is distinct from me.id)
  from me
  join public.crew_members as m on m.user_id = me.id
  join public.crews as c on c.id = m.crew_id
  left join lateral (
    select coalesce(nullif(trim(x.body), ''), '📎 ' || x.attachment_name) as preview,
           x.sender_id, u.display_name as sender_name, x.created_at
    from public.messages as x
    left join public.users as u on u.id = x.sender_id
    where x.crew_id = c.id
    order by x.created_at desc
    limit 1
  ) as last on true

  union all

  select 'direct', t.id, o.display_name, o.id,
         last.preview, last.sender_id, last.sender_name,
         last.created_at,
         (select count(*)::int from public.messages as x
          where x.thread_id = t.id
            and x.created_at > case when t.user_a = me.id
                                    then t.a_last_read_at
                                    else t.b_last_read_at end
            and x.sender_id is distinct from me.id)
  from me
  join public.direct_threads as t on me.id in (t.user_a, t.user_b)
  join public.users as o
    on o.id = case when t.user_a = me.id then t.user_b else t.user_a end
  join lateral (
    select coalesce(nullif(trim(x.body), ''), '📎 ' || x.attachment_name) as preview,
           x.sender_id, u.display_name as sender_name, x.created_at
    from public.messages as x
    left join public.users as u on u.id = x.sender_id
    where x.thread_id = t.id
    order by x.created_at desc
    limit 1
  ) as last on true

  order by 8 desc;
$$;

-- New files go under crew/<id>/. Files uploaded before this migration live
-- under group/<id>/ and keep working.
create or replace function public.can_access_attachment_path(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  folders text[] := storage.foldername(object_name);
  current_user_id text := auth.jwt() ->> 'sub';
  conversation uuid;
begin
  if current_user_id is null or cardinality(folders) <> 2
    or folders[2] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;

  conversation := folders[2]::uuid;

  if folders[1] in ('crew', 'group') then
    return exists (
      select 1 from public.crew_members as m
      where m.crew_id = conversation and m.user_id = current_user_id
    );
  elsif folders[1] = 'direct' then
    return exists (
      select 1 from public.direct_threads as t
      where t.id = conversation and current_user_id in (t.user_a, t.user_b)
    );
  end if;

  return false;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Crew pulse
-- ---------------------------------------------------------------------------

-- Career milestones from the last 7 days about other people who share a crew
-- with the signed-in person and haven't opted out. kind is one of interview,
-- offer, applications, wins, joined.
create function public.get_crew_pulse()
returns table (
  kind text,
  crew_id uuid,
  crew_name text,
  person_name text,
  amount int,
  happened_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select (select auth.jwt() ->> 'sub') as id
  ),
  -- Each crewmate once, with one shared crew to mention.
  crewmates as (
    select distinct on (other.user_id)
      other.user_id, c.id as crew_id, c.name as crew_name, u.display_name
    from me
    join public.crew_members as mine on mine.user_id = me.id
    join public.crew_members as other
      on other.crew_id = mine.crew_id and other.user_id <> me.id
    join public.crews as c on c.id = mine.crew_id
    join public.users as u on u.id = other.user_id
    where u.share_pulse
    order by other.user_id, c.name
  )

  select 'interview', cm.crew_id, cm.crew_name, cm.display_name, null::int,
         max(j.status_changed_at)
  from crewmates as cm
  join public.job_applications as j on j.user_id = cm.user_id
  where j.status = 'interviewing'
    and j.status_changed_at > now() - interval '7 days'
  group by cm.user_id, cm.crew_id, cm.crew_name, cm.display_name

  union all

  select 'offer', cm.crew_id, cm.crew_name, cm.display_name, null::int,
         max(j.status_changed_at)
  from crewmates as cm
  join public.job_applications as j on j.user_id = cm.user_id
  where j.status = 'offer'
    and j.status_changed_at > now() - interval '7 days'
  group by cm.user_id, cm.crew_id, cm.crew_name, cm.display_name

  union all

  select 'applications', cm.crew_id, cm.crew_name, cm.display_name,
         count(*)::int, max(j.created_at)
  from crewmates as cm
  join public.job_applications as j on j.user_id = cm.user_id
  where j.created_at > now() - interval '7 days'
  group by cm.user_id, cm.crew_id, cm.crew_name, cm.display_name

  union all

  select 'wins', cm.crew_id, cm.crew_name, cm.display_name,
         count(*)::int, max(w.created_at)
  from crewmates as cm
  join public.wins as w on w.user_id = cm.user_id
  where w.created_at > now() - interval '7 days'
  group by cm.user_id, cm.crew_id, cm.crew_name, cm.display_name

  union all

  -- New members, named with the crew they actually joined.
  select 'joined', c.id, c.name, u.display_name, null::int, other.joined_at
  from me
  join public.crew_members as mine on mine.user_id = me.id
  join public.crew_members as other
    on other.crew_id = mine.crew_id and other.user_id <> me.id
  join public.crews as c on c.id = mine.crew_id
  join public.users as u on u.id = other.user_id
  where u.share_pulse
    and other.joined_at > now() - interval '7 days'
    and other.joined_at > mine.joined_at

  order by 6 desc
  limit 60;
$$;

-- ---------------------------------------------------------------------------
-- 9. Access
-- ---------------------------------------------------------------------------

-- Internal helpers: only other functions call these.
revoke all on function public.my_crew_role(uuid) from public, anon, authenticated;
revoke all on function public.require_crew_owner(uuid) from public, anon, authenticated;
revoke all on function public.require_conversation_access(uuid, uuid) from public, anon, authenticated;

-- Called by the app, or (is_crew_member) by the messages policy.
revoke all on function public.is_crew_member(uuid) from public, anon;
revoke all on function public.list_crews() from public, anon;
revoke all on function public.get_crew(uuid) from public, anon;
revoke all on function public.get_crew_members(uuid) from public, anon;
revoke all on function public.create_crew(text, text, text, text[]) from public, anon;
revoke all on function public.update_crew(uuid, text, text, text, text[]) from public, anon;
revoke all on function public.regenerate_invite_code(uuid) from public, anon;
revoke all on function public.delete_crew(uuid) from public, anon;
revoke all on function public.join_crew(uuid) from public, anon;
revoke all on function public.join_crew_by_code(text) from public, anon;
revoke all on function public.leave_crew(uuid) from public, anon;
revoke all on function public.remove_crew_member(uuid, text) from public, anon;
revoke all on function public.get_direct_thread(uuid) from public, anon;
revoke all on function public.get_messages(uuid, uuid, timestamptz, int) from public, anon;
revoke all on function public.send_message(text, uuid, uuid, text, text) from public, anon;
revoke all on function public.mark_conversation_read(uuid, uuid) from public, anon;
revoke all on function public.get_conversations() from public, anon;
revoke all on function public.get_crew_pulse() from public, anon;

grant execute on function public.is_crew_member(uuid) to authenticated;
grant execute on function public.list_crews() to authenticated;
grant execute on function public.get_crew(uuid) to authenticated;
grant execute on function public.get_crew_members(uuid) to authenticated;
grant execute on function public.create_crew(text, text, text, text[]) to authenticated;
grant execute on function public.update_crew(uuid, text, text, text, text[]) to authenticated;
grant execute on function public.regenerate_invite_code(uuid) to authenticated;
grant execute on function public.delete_crew(uuid) to authenticated;
grant execute on function public.join_crew(uuid) to authenticated;
grant execute on function public.join_crew_by_code(text) to authenticated;
grant execute on function public.leave_crew(uuid) to authenticated;
grant execute on function public.remove_crew_member(uuid, text) to authenticated;
grant execute on function public.get_direct_thread(uuid) to authenticated;
grant execute on function public.get_messages(uuid, uuid, timestamptz, int) to authenticated;
grant execute on function public.send_message(text, uuid, uuid, text, text) to authenticated;
grant execute on function public.mark_conversation_read(uuid, uuid) to authenticated;
grant execute on function public.get_conversations() to authenticated;
grant execute on function public.get_crew_pulse() to authenticated;

commit;
