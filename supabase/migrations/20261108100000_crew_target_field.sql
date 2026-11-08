begin;

alter table public.crews
  add column target_field text
    check (
      target_field is null or target_field in (
        'tech', 'design', 'marketing', 'sales', 'finance', 'hr', 'operations',
        'support', 'healthcare', 'education', 'public_nonprofit', 'trades',
        'retail_hospitality', 'other'
      )
    );

create index crews_target_field_idx on public.crews (target_field);

drop function public.list_crews();
create function public.list_crews()
returns table (
  id uuid,
  name text,
  description text,
  visibility text,
  tags text[],
  target_field text,
  member_count int,
  my_role text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.name, c.description, c.visibility, c.tags, c.target_field,
         (select count(*)::int from public.crew_members as n where n.crew_id = c.id),
         mine.role,
         c.created_at
  from public.crews as c
  left join public.crew_members as mine
    on mine.crew_id = c.id and mine.user_id = (select auth.jwt() ->> 'sub')
  where c.visibility = 'public' or mine.user_id is not null
  order by (mine.user_id is not null) desc, 7 desc, c.created_at desc;
$$;

drop function public.get_crew(uuid);
create function public.get_crew(target_crew uuid)
returns table (
  id uuid,
  name text,
  description text,
  visibility text,
  tags text[],
  target_field text,
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
  select c.id, c.name, c.description, c.visibility, c.tags, c.target_field,
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

drop function public.create_crew(text, text, text, text[]);
create function public.create_crew(
  new_name text,
  new_description text,
  new_visibility text,
  new_tags text[],
  new_target_field text
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

  if new_target_field is null or new_target_field not in (
    'tech', 'design', 'marketing', 'sales', 'finance', 'hr', 'operations',
    'support', 'healthcare', 'education', 'public_nonprofit', 'trades',
    'retail_hospitality', 'other'
  ) then
    raise exception 'Choose a valid work field for this crew';
  end if;

  insert into public.crews (
    name, description, visibility, tags, target_field, created_by
  )
  values (
    trim(new_name),
    nullif(trim(new_description), ''),
    new_visibility,
    coalesce(new_tags, '{}'),
    new_target_field,
    current_user_id
  )
  returning id into new_crew_id;

  insert into public.crew_members (crew_id, user_id, role)
  values (new_crew_id, current_user_id, 'owner');

  return new_crew_id;
end;
$$;

drop function public.update_crew(uuid, text, text, text, text[]);
create function public.update_crew(
  target_crew uuid,
  new_name text,
  new_description text,
  new_visibility text,
  new_tags text[],
  new_target_field text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_crew_owner(target_crew);

  if new_target_field is null or new_target_field not in (
    'tech', 'design', 'marketing', 'sales', 'finance', 'hr', 'operations',
    'support', 'healthcare', 'education', 'public_nonprofit', 'trades',
    'retail_hospitality', 'other'
  ) then
    raise exception 'Choose a valid work field for this crew';
  end if;

  update public.crews
  set name = trim(new_name),
      description = nullif(trim(new_description), ''),
      visibility = new_visibility,
      tags = coalesce(new_tags, '{}'),
      target_field = new_target_field,
      updated_at = now()
  where id = target_crew;
end;
$$;

drop function public.list_crews_by_field(text);
create function public.list_crews_by_field(requested_field text)
returns table (
  id uuid,
  name text,
  description text,
  visibility text,
  tags text[],
  target_field text,
  member_count int,
  my_role text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.name, c.description, c.visibility, c.tags, c.target_field,
         (select count(*)::int from public.crew_members as n where n.crew_id = c.id),
         mine.role,
         c.created_at
  from public.crews as c
  left join public.crew_members as mine
    on mine.crew_id = c.id and mine.user_id = (select auth.jwt() ->> 'sub')
  where mine.user_id is not null
     or (c.visibility = 'public' and c.target_field = requested_field)
  order by (mine.user_id is not null) desc, 7 desc, c.created_at desc;
$$;

revoke all on function public.list_crews() from public, anon;
revoke all on function public.get_crew(uuid) from public, anon;
revoke all on function public.create_crew(text, text, text, text[], text) from public, anon;
revoke all on function public.update_crew(uuid, text, text, text, text[], text) from public, anon;
revoke all on function public.list_crews_by_field(text) from public, anon;

grant execute on function public.list_crews() to authenticated;
grant execute on function public.get_crew(uuid) to authenticated;
grant execute on function public.create_crew(text, text, text, text[], text) to authenticated;
grant execute on function public.update_crew(uuid, text, text, text, text[], text) to authenticated;
grant execute on function public.list_crews_by_field(text) to authenticated;

commit;
