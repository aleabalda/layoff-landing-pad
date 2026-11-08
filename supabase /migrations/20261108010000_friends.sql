-- Suggests people in a similar spot and lets people add each other as friends.
--
-- Other people only ever see the "safe" profile fields: name, field,
-- experience, city, bio and tags. How someone's job ended, how they felt and
-- what's urgent for them stay private.

begin;

-- ---------------------------------------------------------------------------
-- Opting out of suggestions
-- ---------------------------------------------------------------------------

alter table public.users
  add column discoverable boolean not null default true;

grant update (discoverable) on public.users to authenticated;

-- ---------------------------------------------------------------------------
-- Friendships
-- ---------------------------------------------------------------------------

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id text not null references public.users (id) on delete cascade,
  addressee_id text not null references public.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);

-- One row per pair, whichever direction the request went.
create unique index friendships_pair_idx on public.friendships (
  least(requester_id, addressee_id),
  greatest(requester_id, addressee_id)
);
create index friendships_addressee_idx on public.friendships (addressee_id, status);

alter table public.friendships enable row level security;

create policy "People can see their own friendships"
  on public.friendships for select to authenticated
  using ((select auth.jwt() ->> 'sub') in (requester_id, addressee_id));

-- All changes go through the functions below, so nobody can accept their own
-- request or create an already-accepted friendship.
revoke insert, update, delete on public.friendships from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Suggestions
-- ---------------------------------------------------------------------------

-- Scores everyone else who finished onboarding and hasn't opted out:
-- same field +3, each shared tag +1, same experience +1, same city +1.
-- Leaves out people they're already friends with or have a pending request
-- with, in either direction.
create function public.suggest_people(max_results int default 6)
returns table (
  user_id text,
  display_name text,
  field text,
  experience_level text,
  city text,
  bio text,
  shared_tags text[],
  score int
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select u.id, u.field, u.experience_level, u.city, u.tags
    from public.users as u
    where u.id = (select auth.jwt() ->> 'sub')
  )
  select
    o.id,
    o.display_name,
    o.field,
    o.experience_level,
    o.city,
    o.bio,
    shared.tags,
    (case when o.field = me.field then 3 else 0 end)
      + cardinality(shared.tags)
      + (case when o.experience_level = me.experience_level then 1 else 0 end)
      + (case when lower(o.city) = lower(me.city) then 1 else 0 end)
  from me
  cross join public.users as o
  cross join lateral (
    select array(
      select unnest(o.tags) intersect select unnest(me.tags)
    ) as tags
  ) as shared
  where o.id <> me.id
    and o.onboarded_at is not null
    and o.discoverable
    and not exists (
      select 1
      from public.friendships as f
      where least(f.requester_id, f.addressee_id) = least(me.id, o.id)
        and greatest(f.requester_id, f.addressee_id) = greatest(me.id, o.id)
    )
  order by 8 desc, o.onboarded_at desc
  limit least(greatest(max_results, 1), 20);
$$;

-- ---------------------------------------------------------------------------
-- Friend requests
-- ---------------------------------------------------------------------------

-- If the other person already sent a request, this accepts it instead.
create function public.send_friend_request(to_user text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id text := auth.jwt() ->> 'sub';
  existing public.friendships;
begin
  if current_user_id is null then
    raise exception 'Not signed in';
  end if;

  if to_user = current_user_id then
    raise exception 'You can''t add yourself';
  end if;

  if not exists (
    select 1 from public.users as u
    where u.id = to_user and u.onboarded_at is not null
  ) then
    raise exception 'That person could not be found';
  end if;

  select * into existing
  from public.friendships as f
  where least(f.requester_id, f.addressee_id) = least(current_user_id, to_user)
    and greatest(f.requester_id, f.addressee_id) = greatest(current_user_id, to_user);

  if found then
    if existing.status = 'pending' and existing.addressee_id = current_user_id then
      update public.friendships
      set status = 'accepted', responded_at = now()
      where id = existing.id;
      return 'accepted';
    end if;
    return existing.status;
  end if;

  insert into public.friendships (requester_id, addressee_id)
  values (current_user_id, to_user);

  return 'pending';
end;
$$;

-- Only the person who received the request can answer it. Declining deletes
-- the request, so the sender isn't told and they can be suggested again later.
create function public.respond_to_friend_request(request_id uuid, accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id text := auth.jwt() ->> 'sub';
begin
  if accept then
    update public.friendships
    set status = 'accepted', responded_at = now()
    where id = request_id
      and addressee_id = current_user_id
      and status = 'pending';
  else
    delete from public.friendships
    where id = request_id
      and addressee_id = current_user_id
      and status = 'pending';
  end if;

  if not found then
    raise exception 'That request is no longer available';
  end if;
end;
$$;

-- Removes a friend, or cancels a request either of them sent.
create function public.remove_friend(other_user text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.friendships as f
  where least(f.requester_id, f.addressee_id)
      = least((select auth.jwt() ->> 'sub'), other_user)
    and greatest(f.requester_id, f.addressee_id)
      = greatest((select auth.jwt() ->> 'sub'), other_user);
$$;

-- ---------------------------------------------------------------------------
-- Friends and incoming requests
-- ---------------------------------------------------------------------------

create function public.get_friends()
returns table (
  user_id text,
  display_name text,
  field text,
  experience_level text,
  city text,
  bio text,
  tags text[],
  friends_since timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select o.id, o.display_name, o.field, o.experience_level, o.city, o.bio,
         o.tags, f.responded_at
  from public.friendships as f
  join public.users as o
    on o.id = case
      when f.requester_id = (select auth.jwt() ->> 'sub') then f.addressee_id
      else f.requester_id
    end
  where f.status = 'accepted'
    and (select auth.jwt() ->> 'sub') in (f.requester_id, f.addressee_id)
  order by o.display_name;
$$;

create function public.get_friend_requests()
returns table (
  request_id uuid,
  user_id text,
  display_name text,
  field text,
  experience_level text,
  city text,
  bio text,
  shared_tags text[],
  sent_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select f.id, o.id, o.display_name, o.field, o.experience_level, o.city,
         o.bio,
         array(select unnest(o.tags) intersect select unnest(me.tags)),
         f.created_at
  from public.friendships as f
  join public.users as o on o.id = f.requester_id
  join public.users as me on me.id = f.addressee_id
  where f.addressee_id = (select auth.jwt() ->> 'sub')
    and f.status = 'pending'
  order by f.created_at desc;
$$;

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------

revoke all on function public.suggest_people(int) from public, anon;
revoke all on function public.send_friend_request(text) from public, anon;
revoke all on function public.respond_to_friend_request(uuid, boolean) from public, anon;
revoke all on function public.remove_friend(text) from public, anon;
revoke all on function public.get_friends() from public, anon;
revoke all on function public.get_friend_requests() from public, anon;

grant execute on function public.suggest_people(int) to authenticated;
grant execute on function public.send_friend_request(text) to authenticated;
grant execute on function public.respond_to_friend_request(uuid, boolean) to authenticated;
grant execute on function public.remove_friend(text) to authenticated;
grant execute on function public.get_friends() to authenticated;
grant execute on function public.get_friend_requests() to authenticated;

commit;
