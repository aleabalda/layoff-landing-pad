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
begin
  -- Act as user A
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  perform public.ensure_user('Check A');
  assert public.ensure_user('Other name') = 'Check A', 'ensure_user should not overwrite an existing name';

  insert into public.checkins (user_id, date, mood) values (a, current_date, 4);
  select count(*) into n from public.checkins;
  assert n = 1, 'A should see their own check-in';

  update public.users set field = 'privacy-check-field' where id = a;
  perform public.join_crew();

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

  update public.users set field = 'privacy-check-field' where id = b;
  perform public.join_crew();
  select count(*) into n from public.get_crew_members();
  assert n = 2, 'A and B should share a crew';

  begin
    update public.users set crew_id = null where id = b;
    assert false, 'Changing crew_id directly should be blocked';
  exception when insufficient_privilege then null;
  end;

  -- Back to A: post to the crew, then check B can read it
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  insert into public.crew_posts (crew_id, user_id, content, type)
  select crew_id, a, 'hello', 'win' from public.users where id = a;

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.crew_posts;
  assert n = 1, 'B should see their crew''s post';

  raise exception 'ALL PASSED (this error undoes the test data)';
end $$;
