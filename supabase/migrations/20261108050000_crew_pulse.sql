-- Crew pulse: career updates about people in your crews (the app calls groups
-- "crews"), shown on the Today page.
--
-- Only milestones are shared: landing an interview or an offer, how many
-- applications or small wins someone had this week, and new members. Company
-- names, job titles, check-ins and onboarding answers are never shared.
-- People can turn it off with users.share_pulse.

begin;

-- ---------------------------------------------------------------------------
-- Opting out
-- ---------------------------------------------------------------------------

alter table public.users
  add column share_pulse boolean not null default true;

grant update (share_pulse) on public.users to authenticated;

-- ---------------------------------------------------------------------------
-- When an application's status last changed
-- ---------------------------------------------------------------------------

alter table public.job_applications
  add column status_changed_at timestamptz not null default now();

update public.job_applications set status_changed_at = created_at;

create function public.touch_job_application_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger job_applications_status_changed
  before update on public.job_applications
  for each row execute function public.touch_job_application_status();

-- ---------------------------------------------------------------------------
-- The pulse
-- ---------------------------------------------------------------------------

-- Everything from the last 7 days about other people who share a crew with
-- the signed-in person and haven't opted out. The app picks a few at random.
--
-- kind is one of: interview, offer, applications, wins, joined.
-- amount is the count for applications and wins, otherwise null.
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
      other.user_id, g.id as crew_id, g.name as crew_name, u.display_name
    from me
    join public.group_members as mine on mine.user_id = me.id
    join public.group_members as other
      on other.group_id = mine.group_id and other.user_id <> me.id
    join public.groups as g on g.id = mine.group_id
    join public.users as u on u.id = other.user_id
    where u.share_pulse
    order by other.user_id, g.name
  )

  select 'interview', c.crew_id, c.crew_name, c.display_name, null::int,
         max(j.status_changed_at)
  from crewmates as c
  join public.job_applications as j on j.user_id = c.user_id
  where j.status = 'interviewing'
    and j.status_changed_at > now() - interval '7 days'
  group by c.user_id, c.crew_id, c.crew_name, c.display_name

  union all

  select 'offer', c.crew_id, c.crew_name, c.display_name, null::int,
         max(j.status_changed_at)
  from crewmates as c
  join public.job_applications as j on j.user_id = c.user_id
  where j.status = 'offer'
    and j.status_changed_at > now() - interval '7 days'
  group by c.user_id, c.crew_id, c.crew_name, c.display_name

  union all

  select 'applications', c.crew_id, c.crew_name, c.display_name,
         count(*)::int, max(j.created_at)
  from crewmates as c
  join public.job_applications as j on j.user_id = c.user_id
  where j.created_at > now() - interval '7 days'
  group by c.user_id, c.crew_id, c.crew_name, c.display_name

  union all

  select 'wins', c.crew_id, c.crew_name, c.display_name,
         count(*)::int, max(w.created_at)
  from crewmates as c
  join public.wins as w on w.user_id = c.user_id
  where w.created_at > now() - interval '7 days'
  group by c.user_id, c.crew_id, c.crew_name, c.display_name

  union all

  -- New members, named with the crew they actually joined.
  select 'joined', g.id, g.name, u.display_name, null::int, other.joined_at
  from me
  join public.group_members as mine on mine.user_id = me.id
  join public.group_members as other
    on other.group_id = mine.group_id and other.user_id <> me.id
  join public.groups as g on g.id = mine.group_id
  join public.users as u on u.id = other.user_id
  where u.share_pulse
    and other.joined_at > now() - interval '7 days'
    and other.joined_at > mine.joined_at

  order by 6 desc
  limit 60;
$$;

revoke all on function public.get_crew_pulse() from public, anon;
grant execute on function public.get_crew_pulse() to authenticated;

commit;
