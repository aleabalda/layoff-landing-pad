-- Onboarding: the answers people give after creating an account, plus tags we
-- can match crews on later.
--
-- The allowed values below must match frontend/src/profileOptions.ts.

begin;

alter table public.users
  add column tags text[] not null default '{}',
  -- Null until the onboarding form is finished. The app sends people without
  -- it to /onboarding.
  add column onboarded_at timestamptz;

-- `not valid` so rows written before these choices existed don't block the
-- migration. New writes are still checked.
alter table public.users
  add constraint users_field_check check (
    field in (
      'tech', 'design', 'marketing', 'sales', 'finance', 'hr', 'operations',
      'support', 'healthcare', 'education', 'public_nonprofit', 'trades',
      'retail_hospitality', 'other'
    )
  ) not valid,
  add constraint users_experience_level_check check (
    experience_level in ('entry', 'mid', 'senior', 'leadership')
  ) not valid,
  add constraint users_tags_check check (
    tags <@ array[
      'first_layoff', 'early_career', 'career_change', 'returning',
      'remote', 'relocating', 'freelance', 'own_business', 'back_to_school',
      'parent_caregiver', 'newcomer', 'health',
      'accountability', 'interview_practice', 'resume_help', 'networking',
      'someone_to_talk_to'
    ]::text[]
  ) not valid;

-- For matching people who share tags (`tags && other.tags`).
create index users_tags_idx on public.users using gin (tags);

-- People can edit their tags later, but onboarded_at only changes through
-- save_profile().
grant update (tags) on public.users to authenticated;

-- Saves the onboarding answers for the signed-in user and marks onboarding
-- done. Calling it again updates the answers.
create function public.save_profile(
  new_display_name text,
  new_city text,
  new_job_end_reason text,
  new_initial_feeling text,
  new_urgent_need text,
  new_field text,
  new_experience_level text,
  new_tags text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id text := auth.jwt() ->> 'sub';
begin
  if current_user_id is null then
    raise exception 'Not signed in';
  end if;

  if coalesce(trim(new_display_name), '') = '' then
    raise exception 'Please add your name';
  end if;

  if new_field is null or new_experience_level is null
    or new_job_end_reason is null or new_initial_feeling is null
    or new_urgent_need is null then
    raise exception 'Please answer every required question';
  end if;

  update public.users
  set
    display_name = trim(new_display_name),
    city = nullif(trim(new_city), ''),
    job_end_reason = new_job_end_reason,
    initial_feeling = new_initial_feeling,
    urgent_need = new_urgent_need,
    field = new_field,
    experience_level = new_experience_level,
    tags = coalesce(new_tags, '{}'),
    onboarded_at = coalesce(onboarded_at, now()),
    updated_at = now()
  where id = current_user_id;

  if not found then
    raise exception 'Account not found';
  end if;
end;
$$;

revoke all on function public.save_profile(text, text, text, text, text, text, text, text[]) from public, anon;
grant execute on function public.save_profile(text, text, text, text, text, text, text, text[]) to authenticated;

commit;
