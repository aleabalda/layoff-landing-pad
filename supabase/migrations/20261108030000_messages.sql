-- Messaging: direct messages between friends, and a chat for every group.
--
-- People can read messages through RLS (so Supabase Realtime can deliver new
-- ones live), but sending, starting threads and marking things read go through
-- the functions below.

begin;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- When each member last opened the group chat, for unread counts.
alter table public.group_members
  add column last_read_at timestamptz not null default now();

-- One thread per pair of people. user_a is always the smaller id, so a pair
-- can only have one thread.
create table public.direct_threads (
  id uuid primary key default gen_random_uuid(),
  user_a text not null references public.users (id) on delete cascade,
  user_b text not null references public.users (id) on delete cascade,
  a_last_read_at timestamptz not null default now(),
  b_last_read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);

create index direct_threads_user_b_idx on public.direct_threads (user_b);

-- Each message belongs to exactly one group or one direct thread.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups (id) on delete cascade,
  thread_id uuid references public.direct_threads (id) on delete cascade,
  sender_id text references public.users (id) on delete set null,
  body text not null check (length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  check ((group_id is null) <> (thread_id is null))
);

create index messages_group_idx
  on public.messages (group_id, created_at desc) where group_id is not null;
create index messages_thread_idx
  on public.messages (thread_id, created_at desc) where thread_id is not null;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Used by the messages policy, so it has to be callable by signed-in people.
-- It only ever answers about the caller themselves.
create function public.is_group_member(target_group uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members as m
    where m.group_id = target_group
      and m.user_id = (select auth.jwt() ->> 'sub')
  );
$$;

create function public.are_friends(person_a text, person_b text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.friendships as f
    where f.status = 'accepted'
      and least(f.requester_id, f.addressee_id) = least(person_a, person_b)
      and greatest(f.requester_id, f.addressee_id) = greatest(person_a, person_b)
  );
$$;

-- Raises unless the signed-in person can read this conversation. Exactly one
-- of the two ids must be given.
create function public.require_conversation_access(
  target_group uuid,
  target_thread uuid
)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (target_group is null) = (target_thread is null) then
    raise exception 'Pick one conversation';
  end if;

  if target_group is not null and not public.is_group_member(target_group) then
    raise exception 'Join the group to see its messages';
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

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.direct_threads enable row level security;
alter table public.messages enable row level security;

create policy "People can see their own threads"
  on public.direct_threads for select to authenticated
  using ((select auth.jwt() ->> 'sub') in (user_a, user_b));

create policy "People can read messages in their conversations"
  on public.messages for select to authenticated
  using (
    (group_id is not null and public.is_group_member(group_id))
    or (
      thread_id is not null
      and exists (
        select 1 from public.direct_threads as t
        where t.id = thread_id
          and (select auth.jwt() ->> 'sub') in (t.user_a, t.user_b)
      )
    )
  );

revoke insert, update, delete on public.direct_threads from anon, authenticated;
revoke insert, update, delete on public.messages from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Direct threads
-- ---------------------------------------------------------------------------

-- Finds or creates the thread with a friend and returns its id.
create function public.start_direct_thread(other_user text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id text := auth.jwt() ->> 'sub';
  found_thread uuid;
begin
  if current_user_id is null then
    raise exception 'Not signed in';
  end if;

  if not public.are_friends(current_user_id, other_user) then
    raise exception 'You can only message friends';
  end if;

  insert into public.direct_threads (user_a, user_b)
  values (least(current_user_id, other_user), greatest(current_user_id, other_user))
  on conflict (user_a, user_b) do nothing;

  select t.id into found_thread
  from public.direct_threads as t
  where t.user_a = least(current_user_id, other_user)
    and t.user_b = greatest(current_user_id, other_user);

  return found_thread;
end;
$$;

-- Who the thread is with, and whether messages can still be sent (they stop
-- if either person removes the other as a friend).
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

-- ---------------------------------------------------------------------------
-- Messages
-- ---------------------------------------------------------------------------

-- Newest first. Pass `older_than` (the oldest created_at already loaded) to page
-- back through older messages.
create function public.get_messages(
  target_group uuid default null,
  target_thread uuid default null,
  older_than timestamptz default null,
  max_results int default 50
)
returns table (
  id uuid,
  sender_id text,
  sender_name text,
  body text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_conversation_access(target_group, target_thread);

  return query
  select m.id, m.sender_id, u.display_name, m.body, m.created_at
  from public.messages as m
  left join public.users as u on u.id = m.sender_id
  where (target_group is not null and m.group_id = target_group
         or target_thread is not null and m.thread_id = target_thread)
    and (older_than is null or m.created_at < older_than)
  order by m.created_at desc
  limit least(greatest(max_results, 1), 100);
end;
$$;

create function public.send_message(
  message text,
  target_group uuid default null,
  target_thread uuid default null
)
returns table (
  id uuid,
  sender_id text,
  sender_name text,
  body text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id text := auth.jwt() ->> 'sub';
  other_user text;
begin
  perform public.require_conversation_access(target_group, target_thread);

  if target_thread is not null then
    select case when t.user_a = current_user_id then t.user_b else t.user_a end
    into other_user
    from public.direct_threads as t
    where t.id = target_thread;

    if not public.are_friends(current_user_id, other_user) then
      raise exception 'You can only message friends';
    end if;
  end if;

  return query
  with inserted as (
    insert into public.messages (group_id, thread_id, sender_id, body)
    values (target_group, target_thread, current_user_id, trim(message))
    returning messages.id, messages.sender_id, messages.body, messages.created_at
  )
  select i.id, i.sender_id, u.display_name, i.body, i.created_at
  from inserted as i
  left join public.users as u on u.id = i.sender_id;
end;
$$;

create function public.mark_conversation_read(
  target_group uuid default null,
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
  perform public.require_conversation_access(target_group, target_thread);

  if target_group is not null then
    update public.group_members
    set last_read_at = now()
    where group_id = target_group and user_id = current_user_id;
  else
    update public.direct_threads
    set a_last_read_at = case when user_a = current_user_id then now() else a_last_read_at end,
        b_last_read_at = case when user_b = current_user_id then now() else b_last_read_at end
    where id = target_thread;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Conversation list
-- ---------------------------------------------------------------------------

-- Every group the person is in, plus direct threads that have messages,
-- most recent first.
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
  select 'group', g.id, g.name, null::text,
         last.body, last.sender_id, last.sender_name,
         coalesce(last.created_at, m.joined_at),
         (select count(*)::int from public.messages as x
          where x.group_id = g.id
            and x.created_at > m.last_read_at
            and x.sender_id is distinct from me.id)
  from me
  join public.group_members as m on m.user_id = me.id
  join public.groups as g on g.id = m.group_id
  left join lateral (
    select x.body, x.sender_id, u.display_name as sender_name, x.created_at
    from public.messages as x
    left join public.users as u on u.id = x.sender_id
    where x.group_id = g.id
    order by x.created_at desc
    limit 1
  ) as last on true

  union all

  select 'direct', t.id, o.display_name, o.id,
         last.body, last.sender_id, last.sender_name,
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
    select x.body, x.sender_id, u.display_name as sender_name, x.created_at
    from public.messages as x
    left join public.users as u on u.id = x.sender_id
    where x.thread_id = t.id
    order by x.created_at desc
    limit 1
  ) as last on true

  order by 8 desc;
$$;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

-- Realtime checks the policy above for each subscriber, so people only get
-- messages they're allowed to read.
alter publication supabase_realtime add table public.messages;

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------

revoke all on function public.is_group_member(uuid) from public, anon;
revoke all on function public.are_friends(text, text) from public, anon, authenticated;
revoke all on function public.require_conversation_access(uuid, uuid) from public, anon, authenticated;
revoke all on function public.start_direct_thread(text) from public, anon;
revoke all on function public.get_direct_thread(uuid) from public, anon;
revoke all on function public.get_messages(uuid, uuid, timestamptz, int) from public, anon;
revoke all on function public.send_message(text, uuid, uuid) from public, anon;
revoke all on function public.mark_conversation_read(uuid, uuid) from public, anon;
revoke all on function public.get_conversations() from public, anon;

grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.start_direct_thread(text) to authenticated;
grant execute on function public.get_direct_thread(uuid) to authenticated;
grant execute on function public.get_messages(uuid, uuid, timestamptz, int) to authenticated;
grant execute on function public.send_message(text, uuid, uuid) to authenticated;
grant execute on function public.mark_conversation_read(uuid, uuid) to authenticated;
grant execute on function public.get_conversations() to authenticated;

commit;
