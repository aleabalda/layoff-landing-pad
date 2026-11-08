-- Crew workrooms: a video room per crew, hosted by LiveKit.
--
-- The `workroom` Edge Function calls this with the person's own login token
-- before handing out a LiveKit pass, so only crew members get into a crew's
-- room. Calls aren't recorded and nothing about them is stored here.

begin;

-- Who the signed-in person is and which crew they're joining. Raises unless
-- they're a member.
create function public.get_workroom_identity(target_crew uuid)
returns table (user_id text, display_name text, crew_name text)
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
  select u.id, coalesce(nullif(trim(u.display_name), ''), 'Crewmate'), c.name
  from public.users as u
  cross join public.crews as c
  where u.id = (select auth.jwt() ->> 'sub')
    and c.id = target_crew;
end;
$$;

revoke all on function public.get_workroom_identity(uuid) from public, anon;
grant execute on function public.get_workroom_identity(uuid) to authenticated;

commit;
