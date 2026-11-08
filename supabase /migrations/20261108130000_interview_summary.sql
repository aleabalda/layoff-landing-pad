-- Confidence Room: an overall review and rating at the end of each mock
-- interview, written by frontend/api/interview-summary.ts. Once a session has
-- its summary it's complete, and no more answers can be added to it.

begin;

alter table public.interview_sessions
  -- {"headline": "...", "overall": "...", "strengths": [...],
  --  "areas_to_improve": [...], "next_steps": [...],
  --  "questions": [{"id": "q1", "rating": 4, "note": "..."}]}
  add column summary jsonb,
  -- 1 Getting started, 2 Building, 3 Solid foundation, 4 Interview-ready,
  -- 5 Standout. Must match frontend/api/_lib/interview/limits.ts.
  add column rating smallint check (rating between 1 and 5),
  add column completed_at timestamptz;

-- Saves the summary once. Every question must have an answer first.
create function public.save_interview_summary(
  target_id uuid,
  new_summary jsonb,
  new_rating int
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id text := auth.jwt() ->> 'sub';
  unanswered int;
begin
  if current_user_id is null then
    raise exception 'Not signed in';
  end if;

  select count(*) into unanswered
  from public.interview_sessions as s,
       jsonb_array_elements(s.questions) as q
  where s.id = target_id
    and s.user_id = current_user_id
    and not exists (
      select 1 from public.interview_answers as a
      where a.session_id = s.id and a.question_id = q ->> 'id'
    );

  if unanswered > 0 then
    raise exception 'Answer every question first';
  end if;

  update public.interview_sessions
  set summary = new_summary,
      rating = new_rating,
      completed_at = now()
  where id = target_id
    and user_id = current_user_id
    and questions is not null
    and completed_at is null;

  if not found then
    raise exception 'Interview not found, or already finished';
  end if;
end;
$$;

revoke all on function public.save_interview_summary(uuid, jsonb, int) from public, anon;
grant execute on function public.save_interview_summary(uuid, jsonb, int) to authenticated;

-- Same as before, except a finished interview takes no more answers, and
-- questions must be answered in order: no skipping ahead, and no going back
-- once a later question has an answer. Retrying the current one is fine.
create or replace function public.save_interview_answer(
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
  question_position bigint;
  recent int;
  new_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not signed in';
  end if;

  select q.position
  into question_position
  from public.interview_sessions as s,
       jsonb_array_elements(s.questions) with ordinality as q (item, position)
  where s.id = target_session
    and s.user_id = current_user_id
    and s.completed_at is null
    and q.item ->> 'id' = new_question_id;

  if question_position is null then
    raise exception 'Question not found, or the interview is finished';
  end if;

  -- Every earlier question needs an answer, and no later one may have one.
  if exists (
    select 1
    from public.interview_sessions as s,
         jsonb_array_elements(s.questions) with ordinality as q (item, position)
    where s.id = target_session
      and (
        (q.position < question_position and not exists (
          select 1 from public.interview_answers as a
          where a.session_id = s.id and a.question_id = q.item ->> 'id'))
        or
        (q.position > question_position and exists (
          select 1 from public.interview_answers as a
          where a.session_id = s.id and a.question_id = q.item ->> 'id'))
      )
  ) then
    raise exception 'Questions are answered one at a time, in order';
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

commit;
