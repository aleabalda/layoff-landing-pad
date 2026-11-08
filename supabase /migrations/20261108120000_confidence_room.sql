-- The Confidence Room: mock interviews with AI.
--
-- frontend/api/interview-questions.ts creates a session and its questions with
-- Google Gemini, and frontend/api/interview-feedback.ts saves each answer with
-- Gemini's feedback. Both run with the person's own token, so everything here
-- is limited to their own rows. People can read and delete their sessions, but
-- only the functions below write them, which keeps the daily limits honest.

begin;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub')
    references public.users (id) on delete cascade,
  company text not null check (length(trim(company)) between 1 and 120),
  role text not null check (length(trim(role)) between 1 and 120),
  job_description text check (length(job_description) <= 8000),
  style text not null check (style in ('mixed', 'behavioural', 'technical')),
  used_resume boolean not null default false,
  -- [{"id": "q1", "type": "behavioural", "question": "...",
  --   "looking_for": "...", "tip": "..."}]. Null until Gemini answers.
  questions jsonb,
  model text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create index interview_sessions_user_created_idx
  on public.interview_sessions (user_id, created_at desc);

-- Every attempt at a question is kept, so people can see how they improved.
create table public.interview_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions (id) on delete cascade,
  user_id text not null default (auth.jwt() ->> 'sub')
    references public.users (id) on delete cascade,
  question_id text not null,
  answer text not null check (length(trim(answer)) between 1 and 6000),
  spoken boolean not null default false,
  -- {"overall": "...", "strengths": [...], "improvements": [...],
  --  "stronger_answer": "...", "follow_up": "..."}
  feedback jsonb not null,
  model text,
  created_at timestamptz not null default now()
);

create index interview_answers_session_idx
  on public.interview_answers (session_id, created_at);
create index interview_answers_user_created_idx
  on public.interview_answers (user_id, created_at desc);

alter table public.interview_sessions enable row level security;
alter table public.interview_answers enable row level security;

create policy "Users can view their own interview sessions"
  on public.interview_sessions for select to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'));
create policy "Users can delete their own interview sessions"
  on public.interview_sessions for delete to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'));

create policy "Users can view their own interview answers"
  on public.interview_answers for select to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'));

-- ---------------------------------------------------------------------------
-- Functions the API calls
-- ---------------------------------------------------------------------------

-- Records a new session before Gemini is asked for questions, enforcing the
-- daily limit. Raises SQLSTATE LP429 at the limit. Must match
-- frontend/api/_lib/interview/limits.ts.
create function public.start_interview_session(
  new_company text,
  new_role text,
  new_job_description text,
  new_style text,
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

  perform pg_advisory_xact_lock(hashtext('interview_session:' || current_user_id));

  select count(*) into recent
  from public.interview_sessions as s
  where s.user_id = current_user_id
    and s.created_at > now() - interval '24 hours';

  if recent >= 10 then
    raise exception 'You can start 10 mock interviews a day. Please try again tomorrow.'
      using errcode = 'LP429';
  end if;

  insert into public.interview_sessions (
    user_id, company, role, job_description, style, used_resume
  )
  values (
    current_user_id, trim(new_company), trim(new_role),
    nullif(trim(new_job_description), ''), new_style, coalesce(new_used_resume, false)
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.start_interview_session(text, text, text, text, boolean) from public, anon;
grant execute on function public.start_interview_session(text, text, text, text, boolean) to authenticated;

create function public.finish_interview_session(
  target_id uuid,
  new_questions jsonb,
  new_model text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id text := auth.jwt() ->> 'sub';
begin
  if jsonb_typeof(new_questions) is distinct from 'array'
    or jsonb_array_length(new_questions) = 0 then
    raise exception 'A session needs at least one question';
  end if;

  update public.interview_sessions
  set questions = new_questions,
      model = left(new_model, 100),
      finished_at = now()
  where id = target_id
    and user_id = current_user_id
    and finished_at is null;

  if not found then
    raise exception 'Session not found';
  end if;
end;
$$;

revoke all on function public.finish_interview_session(uuid, jsonb, text) from public, anon;
grant execute on function public.finish_interview_session(uuid, jsonb, text) to authenticated;

-- Saves an answer and its feedback, enforcing the daily limit. Raises SQLSTATE
-- LP429 at the limit. Must match frontend/api/_lib/interview/limits.ts.
create function public.save_interview_answer(
  target_session uuid,
  new_question_id text,
  new_answer text,
  new_spoken boolean,
  new_feedback jsonb,
  new_model text
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

  if not exists (
    select 1
    from public.interview_sessions as s,
         jsonb_array_elements(s.questions) as q
    where s.id = target_session
      and s.user_id = current_user_id
      and q ->> 'id' = new_question_id
  ) then
    raise exception 'Question not found';
  end if;

  perform pg_advisory_xact_lock(hashtext('interview_answer:' || current_user_id));

  select count(*) into recent
  from public.interview_answers as a
  where a.user_id = current_user_id
    and a.created_at > now() - interval '24 hours';

  if recent >= 100 then
    raise exception 'You''ve practised 100 answers today. Please come back tomorrow.'
      using errcode = 'LP429';
  end if;

  insert into public.interview_answers (
    session_id, user_id, question_id, answer, spoken, feedback, model
  )
  values (
    target_session, current_user_id, new_question_id, trim(new_answer),
    coalesce(new_spoken, false), new_feedback, left(new_model, 100)
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.save_interview_answer(uuid, text, text, boolean, jsonb, text) from public, anon;
grant execute on function public.save_interview_answer(uuid, text, text, boolean, jsonb, text) to authenticated;

commit;
