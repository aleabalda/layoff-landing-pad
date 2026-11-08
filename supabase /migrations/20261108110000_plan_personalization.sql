-- AI personalization for the 30-day plan.
--
-- The Plan page asks a few questions, then frontend/api/personalize-plan.ts
-- sends the answers, the person's upcoming tasks and (if they agree) their
-- resume to Google Gemini, and saves the rewritten tasks with
-- finish_plan_personalization(). That function runs with the person's own
-- token, so everything here is limited to their own rows.
--
-- Original task text is kept so restore_original_plan() can undo it.

begin;

-- ---------------------------------------------------------------------------
-- Tasks remember what they said before they were personalized
-- ---------------------------------------------------------------------------

alter table public.tasks
  add column original_title text,
  add column original_energy text
    check (original_energy in ('low', 'medium', 'high')),
  add column personalized_at timestamptz;

-- ---------------------------------------------------------------------------
-- One row per personalization, for the rate limit and to prefill the form
-- ---------------------------------------------------------------------------

create table public.plan_personalizations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub')
    references public.users (id) on delete cascade,
  answers jsonb not null,
  used_resume boolean not null default false,
  model text,
  summary text check (length(summary) <= 600),
  tasks_updated int,
  created_at timestamptz not null default now(),
  -- Null if the AI step failed or is still running.
  finished_at timestamptz
);

create index plan_personalizations_user_created_idx
  on public.plan_personalizations (user_id, created_at desc);

alter table public.plan_personalizations enable row level security;

-- Read-only for the person. Rows are only written by the functions below, so
-- nobody can delete them to get around the daily limit.
create policy "Users can view their own personalizations"
  on public.plan_personalizations for select to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'));

-- ---------------------------------------------------------------------------
-- Functions the API calls
-- ---------------------------------------------------------------------------

-- Records an attempt and enforces the daily limit (which also protects the
-- Gemini quota). Raises SQLSTATE LP429 when the limit is reached. Must match
-- DAILY_LIMIT in frontend/api/personalize-plan.ts.
create function public.start_plan_personalization(
  new_answers jsonb,
  new_used_resume boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id text := auth.jwt() ->> 'sub';
  recent int;
  new_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not signed in';
  end if;

  -- Serialize attempts per person so the count below can't be raced.
  perform pg_advisory_xact_lock(hashtext('plan_personalization:' || current_user_id));

  select count(*)
  into recent
  from public.plan_personalizations as p
  where p.user_id = current_user_id
    and p.created_at > now() - interval '24 hours';

  if recent >= 5 then
    raise exception 'You can personalize your plan 5 times a day. Please try again tomorrow.'
      using errcode = 'LP429';
  end if;

  insert into public.plan_personalizations (user_id, answers, used_resume)
  values (current_user_id, coalesce(new_answers, '{}'::jsonb), coalesce(new_used_resume, false))
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.start_plan_personalization(jsonb, boolean) from public, anon;
grant execute on function public.start_plan_personalization(jsonb, boolean) to authenticated;

-- Applies the rewritten tasks in one step. `updates` is
-- [{"id": "<task id>", "title": "...", "energy": "low|medium|high"}].
-- Only the person's own unfinished tasks change. Returns how many did.
create function public.finish_plan_personalization(
  target_id uuid,
  new_model text,
  new_summary text,
  updates jsonb
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id text := auth.jwt() ->> 'sub';
  changed int;
begin
  if current_user_id is null then
    raise exception 'Not signed in';
  end if;

  if not exists (
    select 1 from public.plan_personalizations as p
    where p.id = target_id
      and p.user_id = current_user_id
      and p.finished_at is null
  ) then
    raise exception 'Personalization not found';
  end if;

  if jsonb_typeof(updates) is distinct from 'array' then
    raise exception 'Updates must be a list';
  end if;

  update public.tasks as t
  set original_title = coalesce(t.original_title, t.title),
      original_energy = coalesce(t.original_energy, t.energy_level),
      title = trim(u.title),
      energy_level = u.energy,
      personalized_at = now()
  from jsonb_to_recordset(updates) as u (id uuid, title text, energy text)
  where t.id = u.id
    and t.user_id = current_user_id
    and t.done = false
    and length(trim(u.title)) between 3 and 160
    and u.energy in ('low', 'medium', 'high');

  get diagnostics changed = row_count;

  update public.plan_personalizations
  set model = left(new_model, 100),
      summary = left(trim(new_summary), 600),
      tasks_updated = changed,
      finished_at = now()
  where id = target_id;

  return changed;
end;
$$;

revoke all on function public.finish_plan_personalization(uuid, text, text, jsonb) from public, anon;
grant execute on function public.finish_plan_personalization(uuid, text, text, jsonb) to authenticated;

-- Puts unfinished tasks back to the template's wording. Finished tasks keep
-- what they said when they were ticked, so they still match their small wins.
create function public.restore_original_plan()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id text := auth.jwt() ->> 'sub';
  changed int;
begin
  if current_user_id is null then
    raise exception 'Not signed in';
  end if;

  update public.tasks
  set title = original_title,
      energy_level = coalesce(original_energy, energy_level),
      original_title = null,
      original_energy = null,
      personalized_at = null
  where user_id = current_user_id
    and done = false
    and original_title is not null;

  get diagnostics changed = row_count;
  return changed;
end;
$$;

revoke all on function public.restore_original_plan() from public, anon;
grant execute on function public.restore_original_plan() to authenticated;

commit;
