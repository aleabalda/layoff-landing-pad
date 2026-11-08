-- Image and PDF attachments on messages.
--
-- Files live in the private `message-attachments` bucket at
--   group/<group id>/<random>.<ext>   or   direct/<thread id>/<random>.<ext>
-- so storage policies can check that the person belongs to that conversation.
-- The app shows files through short-lived signed URLs.
--
-- Allowed types and the size limit must match frontend/src/pages/Messages/attachments.ts.

begin;

-- ---------------------------------------------------------------------------
-- Bucket
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'message-attachments',
  'message-attachments',
  false,
  10485760, -- 10 MB
  array['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- True when the signed-in person can read the conversation a file path
-- belongs to. Used by the storage policies below.
create function public.can_access_attachment_path(object_name text)
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

  if folders[1] = 'group' then
    return exists (
      select 1 from public.group_members as m
      where m.group_id = conversation and m.user_id = current_user_id
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

revoke all on function public.can_access_attachment_path(text) from public, anon;
grant execute on function public.can_access_attachment_path(text) to authenticated;

create policy "Conversation members can upload attachments"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'message-attachments'
    and public.can_access_attachment_path(name)
  );

create policy "Conversation members can view attachments"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'message-attachments'
    and public.can_access_attachment_path(name)
  );

-- ---------------------------------------------------------------------------
-- Messages
-- ---------------------------------------------------------------------------

-- One attachment per message. Type and size come from Storage, not the app.
alter table public.messages
  add column attachment_path text,
  add column attachment_name text check (length(attachment_name) <= 200),
  add column attachment_type text,
  add column attachment_size bigint;

-- A message can now be just an attachment, with no text.
alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages
  add constraint messages_body_check check (
    length(body) <= 2000
    and (length(trim(body)) > 0 or attachment_path is not null)
  );

-- Their return types change, which `create or replace` can't do.
drop function public.get_messages(uuid, uuid, timestamptz, int);
drop function public.send_message(text, uuid, uuid);

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
  perform public.require_conversation_access(target_group, target_thread);

  return query
  select m.id, m.sender_id, u.display_name, m.body,
         m.attachment_path, m.attachment_name, m.attachment_type, m.attachment_size,
         m.created_at
  from public.messages as m
  left join public.users as u on u.id = m.sender_id
  where (target_group is not null and m.group_id = target_group
         or target_thread is not null and m.thread_id = target_thread)
    and (older_than is null or m.created_at < older_than)
  order by m.created_at desc
  limit least(greatest(max_results, 1), 100);
end;
$$;

-- Upload the file to Storage first, then pass its path here.
create function public.send_message(
  message text,
  target_group uuid default null,
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

  if new_attachment_path is not null then
    -- The file must be in this conversation's folder, so nobody can attach a
    -- file from somewhere else.
    if new_attachment_path not like
      (case when target_group is not null
            then 'group/' || target_group
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
      group_id, thread_id, sender_id, body,
      attachment_path, attachment_name, attachment_type, attachment_size
    )
    values (
      target_group, target_thread, current_user_id, trim(coalesce(message, '')),
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

revoke all on function public.get_messages(uuid, uuid, timestamptz, int) from public, anon;
revoke all on function public.send_message(text, uuid, uuid, text, text) from public, anon;
grant execute on function public.get_messages(uuid, uuid, timestamptz, int) to authenticated;
grant execute on function public.send_message(text, uuid, uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Conversation list previews
-- ---------------------------------------------------------------------------

-- Same as before, except a message with only an attachment previews as
-- "📎 file name".
create or replace function public.get_conversations()
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
         last.preview, last.sender_id, last.sender_name,
         coalesce(last.created_at, m.joined_at),
         (select count(*)::int from public.messages as x
          where x.group_id = g.id
            and x.created_at > m.last_read_at
            and x.sender_id is distinct from me.id)
  from me
  join public.group_members as m on m.user_id = me.id
  join public.groups as g on g.id = m.group_id
  left join lateral (
    select coalesce(nullif(trim(x.body), ''), '📎 ' || x.attachment_name) as preview,
           x.sender_id, u.display_name as sender_name, x.created_at
    from public.messages as x
    left join public.users as u on u.id = x.sender_id
    where x.group_id = g.id
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

commit;
