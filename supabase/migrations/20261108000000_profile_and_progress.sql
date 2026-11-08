-- Profile page: a bio people can edit, the small wins they tick off on Home,
-- and a tracker for their job applications.
--
-- Allowed values must match frontend/src/profileOptions.ts.

begin;

-- ---------------------------------------------------------------------------
-- Profile
-- ---------------------------------------------------------------------------

alter table public.users
  add column bio text check (length(bio) <= 500);

grant update (bio) on public.users to authenticated;

-- Onboarding now offers more feelings than the original three.
alter table public.users drop constraint if exists users_initial_feeling_check;
alter table public.users
  add constraint users_initial_feeling_check check (
    initial_feeling in ('overwhelmed', 'sad', 'anxious', 'confused', 'okay', 'hopeful')
  );

-- ---------------------------------------------------------------------------
-- Small wins
-- ---------------------------------------------------------------------------

-- One row per task ticked off on Home. Like check-ins, `date` is the person's
-- local date, sent by the app.
create table public.wins (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub')
    references public.users (id) on delete cascade,
  date date not null,
  title text not null check (length(trim(title)) between 1 and 200),
  created_at timestamptz not null default now(),
  unique (user_id, date, title)
);

create index wins_user_date_idx on public.wins (user_id, date desc);

alter table public.wins enable row level security;

create policy "Users manage their own wins"
  on public.wins for all to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'))
  with check (user_id = (select auth.jwt() ->> 'sub'));

-- ---------------------------------------------------------------------------
-- Job applications
-- ---------------------------------------------------------------------------

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub')
    references public.users (id) on delete cascade,
  company text not null check (length(trim(company)) between 1 and 120),
  job_title text not null check (length(trim(job_title)) between 1 and 120),
  status text not null default 'applied'
    check (status in ('applied', 'interviewing', 'offer', 'rejected')),
  applied_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index job_applications_user_idx
  on public.job_applications (user_id, applied_on desc);

alter table public.job_applications enable row level security;

create policy "Users manage their own job applications"
  on public.job_applications for all to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'))
  with check (user_id = (select auth.jwt() ->> 'sub'));

commit;
