-- Checks the privacy rules and crew functions by acting as two Auth0 users.
-- Paste it into the Supabase SQL Editor and run it.
--
-- A red "ALL PASSED" error means success. Raising that error is what undoes the
-- test data, so nothing is saved. Any other error means a check failed.

do $$
declare
  a text := 'auth0|privacy-check-a';
  b text := 'auth0|privacy-check-b';
  n int;
  task_a uuid;
  crew_x uuid;
  code text;
  one_task jsonb := '[{"key": "check-task", "week": 1, "day": 1, "position": 0, "category": "steady", "energy": "low", "title": "Check task"}]';
begin
  -- field must be one of the allowed values, so the test users could land in a
  -- real crew. join_crew() picks the newest crew with room, so this one, dated
  -- tomorrow, is where both test users go. It's undone with the rest.
  insert into public.crews (field, start_date) values ('other', current_date + 1);

  -- Act as user A
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  perform public.ensure_user('Check A');
  assert public.ensure_user('Other name') = 'Check A', 'ensure_user should not overwrite an existing name';

  insert into public.checkins (user_id, date, mood) values (a, current_date, 4);
  select count(*) into n from public.checkins;
  assert n = 1, 'A should see their own check-in';

  -- A finishes onboarding (creating a crew needs it) and starts a private crew.
  perform public.save_profile('Check A', null, 'laid_off', 'okay', 'next_job', 'other', 'mid', '{}');
  crew_x := public.create_crew('Privacy check crew', null, 'private', '{}');
  select g.invite_code into code from public.get_crew(crew_x) as g;
  assert code is not null, 'The owner should see the invite code';

  -- Act as user B
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform public.ensure_user('Check B');

  select count(*) into n from public.checkins;
  assert n = 0, 'B should NOT see A''s check-in';
  select count(*) into n from public.users where id = a;
  assert n = 0, 'B should NOT see A''s users row';

  begin
    insert into public.checkins (user_id, date, mood) values (a, current_date - 1, 1);
    assert false, 'B should NOT be able to write a check-in as A';
  exception when insufficient_privilege then null;
  end;

  -- B can't find, open or read the private crew before joining.
  select count(*) into n from public.list_crews() as g where g.id = crew_x;
  assert n = 0, 'B should NOT see A''s private crew in the list';
  begin
    perform public.get_crew(crew_x);
    assert false, 'B should NOT be able to open A''s private crew';
  exception when raise_exception then null;
  end;
  begin
    perform 1 from public.crews;
    assert false, 'Reading the crews table directly should be blocked';
  exception when insufficient_privilege then null;
  end;

  -- Back to A: post in the crew chat before B joins.
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform public.send_message('hello', crew_x);

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.messages;
  assert n = 0, 'B should NOT see a crew''s messages before joining';

  -- B joins with the code: now they share the crew and can read its chat.
  assert public.join_crew_by_code(code) = crew_x, 'The invite code should join A''s crew';
  select count(*) into n from public.get_crew_members(crew_x);
  assert n = 2, 'A and B should share a crew';
  select count(*) into n from public.messages;
  assert n = 1, 'B should see their crew''s messages';
  select g.invite_code into code from public.get_crew(crew_x) as g;
  assert code is null, 'Only the owner should see the invite code';

  -- Plans: A builds one and ticks a task. B can't see or tick A's tasks.
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  assert public.create_plan(current_date, one_task) = current_date, 'A should be able to build a plan';
  assert public.create_plan(current_date + 1, one_task) = current_date, 'create_plan should keep an existing plan';
  select count(*) into n from public.tasks;
  assert n = 1, 'Building a plan twice should not duplicate tasks';

  select id into task_a from public.tasks where template_key = 'check-task';
  perform public.set_task_done(task_a, true, current_date);
  select count(*) into n from public.wins where task_id = task_a;
  assert n = 1, 'Ticking a task should record a win';
  perform public.set_task_done(task_a, false, current_date);
  select count(*) into n from public.wins where task_id = task_a;
  assert n = 0, 'Unticking a task should remove its win';

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.tasks;
  assert n = 0, 'B should NOT see A''s plan';
  begin
    perform public.set_task_done(task_a, true, current_date);
    assert false, 'B should NOT be able to tick A''s task';
  exception when raise_exception then null;
  end;

  -- Plans: A builds one and ticks a task. B can't see or tick A's tasks.
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  assert public.create_plan(current_date, one_task) = current_date, 'A should be able to build a plan';
  assert public.create_plan(current_date + 1, one_task) = current_date, 'create_plan should keep an existing plan';
  select count(*) into n from public.tasks;
  assert n = 1, 'Building a plan twice should not duplicate tasks';

  select id into task_a from public.tasks where template_key = 'check-task';
  perform public.set_task_done(task_a, true, current_date);
  select count(*) into n from public.wins where task_id = task_a;
  assert n = 1, 'Ticking a task should record a win';
  perform public.set_task_done(task_a, false, current_date);
  select count(*) into n from public.wins where task_id = task_a;
  assert n = 0, 'Unticking a task should remove its win';

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.tasks;
  assert n = 0, 'B should NOT see A''s plan';
  begin
    perform public.set_task_done(task_a, true, current_date);
    assert false, 'B should NOT be able to tick A''s task';
  exception when raise_exception then null;
  end;

  raise exception 'ALL PASSED (this error undoes the test data)';
end $$;
