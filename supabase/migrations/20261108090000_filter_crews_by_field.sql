-- List public crews with at least one member in a selected profile field.
-- Crews the caller belongs to remain visible regardless of the filter.
create function public.list_crews_by_field(target_field text)
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
  where mine.user_id is not null
     or (
       c.visibility = 'public'
       and exists (
         select 1
         from public.crew_members as member
         join public.users as profile on profile.id = member.user_id
         where member.crew_id = c.id
           and profile.field = target_field
       )
     )
  order by (mine.user_id is not null) desc, 6 desc, c.created_at desc;
$$;

revoke all on function public.list_crews_by_field(text) from public, anon;
grant execute on function public.list_crews_by_field(text) to authenticated;
