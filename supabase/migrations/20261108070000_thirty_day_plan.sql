-- The 30-day plan: 4 weeks of daily tasks, built from the template in
-- frontend/src/plan/planTemplate.ts when someone finishes onboarding.
--
-- Allowed categories must match frontend/src/plan/planTemplate.ts.

begin;

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

-- The person's local date for day 1. Null until their plan is built. Only
-- create_plan() sets it.
alter table public.users
  add column plan_start_date date;

-- Plan tasks have a day. Checklist items (is_checklist) may leave it null.
alter table public.tasks
  add column day smallint check (day between 1 and 7),
  add column position smallint not null default 0,
  add column category text check (category in ('steady', 'rebuild', 'crew')),
  -- Which template task this came from, so a plan can't be built twice.
  add column template_key text,
  add column done_at timestamptz;

alter table public.tasks
  alter column user_id set default (auth.jwt() ->> 'sub');

create unique index tasks_user_template_key_idx
  on public.tasks (user_id, template_key);

create index tasks_user_plan_idx
  on public.tasks (user_id, week, day, position);

-- A ticked plan task is also a small win. Unticking it removes that win.
alter table public.wins
  add column task_id uuid references public.tasks (id) on delete cascade;

create unique index wins_task_idx on public.wins (task_id);

-- ---------------------------------------------------------------------------
-- Functions the app calls
-- ---------------------------------------------------------------------------

-- Saves a freshly built plan for the signed-in user. If they already have one,
-- nothing changes and the existing start date is returned, so a double submit
-- or a retry is harmless.
create function public.create_plan(new_start_date date, new_tasks jsonb)
returns date
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id text := auth.jwt() ->> 'sub';
  existing_start date;
begin
  if current_user_id is null then
    raise exception 'Not signed in';
  end if;

  -- Locks the row so two calls can't both build a plan.
  select u.plan_start_date
  into existing_start
  from public.users as u
  where u.id = current_user_id
  for update;

  if not found then
    raise exception 'Account not found';
  end if;

  if existing_start is not null then
    return existing_start;
  end if;

  -- The client sends its local date. Allow a day either way for time zones.
  if new_start_date is null
    or new_start_date not between current_date - 1 and current_date + 1 then
    raise exception 'The plan must start today';
  end if;

  if jsonb_typeof(new_tasks) is distinct from 'array'
    or jsonb_array_length(new_tasks) = 0 then
    raise exception 'A plan needs at least one task';
  end if;

  insert into public.tasks (
    user_id, week, day, position, category, energy_level, title, link_url,
    template_key
  )
  select
    current_user_id, t.week, t.day, t.position, t.category, t.energy,
    trim(t.title), nullif(t.link_url, ''), t.key
  from jsonb_to_recordset(new_tasks) as t (
    key text,
    week smallint,
    day smallint,
    position smallint,
    category text,
    energy text,
    title text,
    link_url text
  );

  update public.users
  set plan_start_date = new_start_date
  where id = current_user_id;

  return new_start_date;
end;
$$;

revoke all on function public.create_plan(date, jsonb) from public, anon;
grant execute on function public.create_plan(date, jsonb) to authenticated;

-- Ticks or unticks a task and records or removes the matching small win in one
-- step. Runs as the caller, so row-level security limits it to their own tasks.
create function public.set_task_done(
  target_task_id uuid,
  new_done boolean,
  local_date date
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  task_title text;
begin
  update public.tasks
  set done = new_done,
      done_at = case when new_done then now() end
  where id = target_task_id
  returning title into task_title;

  if not found then
    raise exception 'Task not found';
  end if;

  if new_done then
    insert into public.wins (date, title, task_id)
    values (local_date, task_title, target_task_id)
    on conflict do nothing;
  else
    delete from public.wins where task_id = target_task_id;
  end if;
end;
$$;

revoke all on function public.set_task_done(uuid, boolean, date) from public, anon;
grant execute on function public.set_task_done(uuid, boolean, date) to authenticated;

commit;
