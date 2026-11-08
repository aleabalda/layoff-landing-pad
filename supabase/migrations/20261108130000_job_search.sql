-- Job search tab: track postings from Indeed, LinkedIn and elsewhere, from
-- "saved" through to an offer.
--
-- Job details can't be fetched from Indeed or LinkedIn (they block it and
-- their terms forbid scraping), so people paste the link and type the rest.
-- Statuses and sources must match frontend/src/pages/Jobs/jobTypes.ts.

begin;

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

alter table public.job_applications
  add column posting_url text
    check (posting_url is null or (posting_url ~* '^https?://' and length(posting_url) <= 2000)),
  add column source text not null default 'other'
    check (source in ('indeed', 'linkedin', 'other')),
  add column location text check (length(location) <= 120),
  add column notes text check (length(notes) <= 1000);

-- "Saved" is a posting someone found but hasn't applied to yet.
alter table public.job_applications drop constraint if exists job_applications_status_check;
alter table public.job_applications
  add constraint job_applications_status_check
  check (status in ('saved', 'applied', 'interviewing', 'offer', 'rejected'));

-- A saved posting has no application date until it's applied to.
alter table public.job_applications alter column applied_on drop not null;
alter table public.job_applications
  add constraint job_applications_applied_on_check
  check (status = 'saved' or applied_on is not null);

create index job_applications_user_status_idx
  on public.job_applications (user_id, status);

-- ---------------------------------------------------------------------------
-- Crew pulse
-- ---------------------------------------------------------------------------

-- Same as in 20261108060000_groups_become_crews.sql, except "applications"
-- now counts by the date someone applied and skips saved postings.
create or replace function public.get_crew_pulse()
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

  -- Saved postings aren't applications yet, so they don't count.
  select 'applications', cm.crew_id, cm.crew_name, cm.display_name,
         count(*)::int, max(j.status_changed_at)
  from crewmates as cm
  join public.job_applications as j on j.user_id = cm.user_id
  where j.status <> 'saved'
    and j.applied_on > current_date - 7
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

commit;
