-- Test people for trying out suggestions and friend requests.
--
-- These aren't real Auth0 accounts, so nobody can log in as them. Their IDs
-- start with 'seed|' so they're easy to find and remove (see the bottom).
-- Safe to run more than once: it updates the rows instead of duplicating them.
--
-- Values must match the checks in the migrations (field, experience_level,
-- initial_feeling, tags, ...). Run it after all the migrations, including
-- 20261108060000_groups_become_crews.sql.

begin;

insert into public.users (
  id, display_name, city, bio,
  job_end_reason, initial_feeling, urgent_need,
  field, experience_level, tags,
  discoverable, onboarded_at
)
values
  (
    'seed|01', 'Priya', 'Calgary',
    'Frontend developer for six years, mostly React. Laid off in a round of 200. Looking for a remote team that ships carefully.',
    'laid_off', 'anxious', 'next_job',
    'tech', 'mid', array['first_layoff', 'remote', 'interview_practice', 'accountability'],
    true, now() - interval '3 days'
  ),
  (
    'seed|02', 'Marcus', 'Edmonton',
    'Backend and data engineer. Second layoff in two years, so I''m weighing contract work this time.',
    'laid_off', 'okay', 'money',
    'tech', 'senior', array['freelance', 'remote', 'networking'],
    true, now() - interval '9 days'
  ),
  (
    'seed|03', 'Jess', 'Calgary',
    'Just finished my CS degree and my new-grad offer was rescinded. Trying to stay positive and keep building projects.',
    'let_go', 'confused', 'next_job',
    'tech', 'entry', array['early_career', 'first_layoff', 'resume_help', 'interview_practice'],
    true, now() - interval '1 day'
  ),
  (
    'seed|04', 'Daniel', 'Vancouver',
    'Product designer. Taking a breath before deciding whether to go back in-house or start a small studio.',
    'quit', 'hopeful', 'figuring_out',
    'design', 'senior', array['own_business', 'freelance', 'career_change'],
    true, now() - interval '14 days'
  ),
  (
    'seed|05', 'Aisha', 'Calgary',
    'Marketing manager and mom of two. My whole team was cut. Looking for something with flexible hours.',
    'laid_off', 'overwhelmed', 'money',
    'marketing', 'leadership', array['parent_caregiver', 'remote', 'someone_to_talk_to', 'networking'],
    true, now() - interval '5 days'
  ),
  (
    'seed|06', 'Tom', 'Red Deer',
    'Twenty years in oil and gas operations. Thinking seriously about retraining for something new.',
    'laid_off', 'sad', 'figuring_out',
    'operations', 'senior', array['career_change', 'back_to_school', 'someone_to_talk_to'],
    true, now() - interval '20 days'
  ),
  (
    'seed|07', 'Mei', 'Toronto',
    'Recruiter who ended up on the other side of a layoff. Happy to give resume feedback in return for some accountability.',
    'laid_off', 'okay', 'next_job',
    'hr', 'mid', array['accountability', 'networking', 'relocating'],
    true, now() - interval '7 days'
  ),
  (
    'seed|08', 'Carlos', 'Calgary',
    'Moved to Canada last year on a work permit and my contract ended early. Learning how job hunting works here.',
    'let_go', 'anxious', 'money',
    'support', 'mid', array['newcomer', 'resume_help', 'interview_practice'],
    true, now() - interval '2 days'
  ),
  (
    'seed|09', 'Hannah', 'Edmonton',
    'Accountant coming back after two years off for my health. Rusty but ready.',
    'complicated', 'hopeful', 'next_job',
    'finance', 'mid', array['returning', 'health', 'accountability'],
    true, now() - interval '11 days'
  ),
  (
    -- Opted out of suggestions, to check that they never appear.
    'seed|10', 'Sam', 'Calgary',
    'QA engineer. Keeping things low-key for now.',
    'laid_off', 'overwhelmed', 'mental_health',
    'tech', 'mid', array['first_layoff', 'remote', 'someone_to_talk_to'],
    false, now() - interval '4 days'
  )
on conflict (id) do update set
  display_name = excluded.display_name,
  city = excluded.city,
  bio = excluded.bio,
  job_end_reason = excluded.job_end_reason,
  initial_feeling = excluded.initial_feeling,
  urgent_need = excluded.urgent_need,
  field = excluded.field,
  experience_level = excluded.experience_level,
  tags = excluded.tags,
  discoverable = excluded.discoverable,
  onboarded_at = excluded.onboarded_at,
  updated_at = now();

-- A couple of friendships among the test people, so they don't all look new.
insert into public.friendships (requester_id, addressee_id, status, responded_at)
values
  ('seed|01', 'seed|02', 'accepted', now() - interval '2 days'),
  ('seed|05', 'seed|07', 'accepted', now() - interval '1 day'),
  ('seed|03', 'seed|01', 'pending', null)
on conflict do nothing;

-- Crews: four public ones to browse and one private one (invite code
-- SEEDCODE01) to try joining by code.
insert into public.crews (id, name, description, visibility, tags, invite_code, created_by)
values
  (
    '00000000-0000-4000-8000-000000000001', 'Remote tech job hunters',
    'For developers, designers and data folks looking for remote roles. We share leads, swap interview stories and do a weekly "applications sent" check-in.',
    'public', array['remote', 'interview_practice', 'accountability'], 'SEEDPUB001', 'seed|01'
  ),
  (
    '00000000-0000-4000-8000-000000000002', 'First-time layoff support',
    'If this is your first time going through a layoff, you''re not alone. A gentle space to talk about how it feels and what helped.',
    'public', array['first_layoff', 'someone_to_talk_to'], 'SEEDPUB002', 'seed|05'
  ),
  (
    '00000000-0000-4000-8000-000000000003', 'Career changers',
    'Thinking about retraining, going back to school, or trying something completely new? Let''s figure it out together.',
    'public', array['career_change', 'back_to_school'], 'SEEDPUB003', 'seed|06'
  ),
  (
    '00000000-0000-4000-8000-000000000004', 'Resume swap',
    'Post your resume, get honest feedback, and give some back. A recruiter is in the crew.',
    'public', array['resume_help', 'networking'], 'SEEDPUB004', 'seed|07'
  ),
  (
    '00000000-0000-4000-8000-000000000005', 'Calgary parents back to work',
    'A small private crew for Calgary parents juggling a job search and family.',
    'private', array['parent_caregiver', 'accountability'], 'SEEDCODE01', 'seed|05'
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  visibility = excluded.visibility,
  tags = excluded.tags,
  invite_code = excluded.invite_code;

insert into public.crew_members (crew_id, user_id, role)
values
  ('00000000-0000-4000-8000-000000000001', 'seed|01', 'owner'),
  ('00000000-0000-4000-8000-000000000001', 'seed|02', 'member'),
  ('00000000-0000-4000-8000-000000000001', 'seed|03', 'member'),
  ('00000000-0000-4000-8000-000000000002', 'seed|05', 'owner'),
  ('00000000-0000-4000-8000-000000000002', 'seed|03', 'member'),
  ('00000000-0000-4000-8000-000000000002', 'seed|10', 'member'),
  ('00000000-0000-4000-8000-000000000003', 'seed|06', 'owner'),
  ('00000000-0000-4000-8000-000000000003', 'seed|04', 'member'),
  ('00000000-0000-4000-8000-000000000004', 'seed|07', 'owner'),
  ('00000000-0000-4000-8000-000000000004', 'seed|08', 'member'),
  ('00000000-0000-4000-8000-000000000004', 'seed|09', 'member'),
  ('00000000-0000-4000-8000-000000000005', 'seed|05', 'owner')
on conflict do nothing;

-- A few messages so the crew chats aren't empty.
insert into public.messages (id, crew_id, sender_id, body, created_at)
values
  ('00000000-0000-4000-9000-000000000001', '00000000-0000-4000-8000-000000000001', 'seed|01',
   'Welcome everyone! Weekly check-in: how many applications did you send this week?', now() - interval '2 days'),
  ('00000000-0000-4000-9000-000000000002', '00000000-0000-4000-8000-000000000001', 'seed|02',
   'Four this week. Two were contract roles, which feel a lot less scary right now.', now() - interval '2 days' + interval '40 minutes'),
  ('00000000-0000-4000-9000-000000000003', '00000000-0000-4000-8000-000000000001', 'seed|03',
   'Three! And I finally have a technical interview on Thursday. Any tips?', now() - interval '1 day'),
  ('00000000-0000-4000-9000-000000000004', '00000000-0000-4000-8000-000000000001', 'seed|01',
   'Talk through your thinking out loud, even when you''re stuck. Happy to do a mock run Wednesday.', now() - interval '20 hours'),
  ('00000000-0000-4000-9000-000000000005', '00000000-0000-4000-8000-000000000002', 'seed|05',
   'This is a space to just be honest about how it feels. No advice unless someone asks for it.', now() - interval '3 days'),
  ('00000000-0000-4000-9000-000000000006', '00000000-0000-4000-8000-000000000002', 'seed|03',
   'Honestly the hardest part is mornings. I don''t know what to do with myself.', now() - interval '2 days'),
  ('00000000-0000-4000-9000-000000000007', '00000000-0000-4000-8000-000000000002', 'seed|05',
   'Same. A short walk before opening my laptop has helped a little.', now() - interval '2 days' + interval '1 hour'),
  ('00000000-0000-4000-9000-000000000008', '00000000-0000-4000-8000-000000000004', 'seed|07',
   'Drop your resume here whenever you''re ready. I''ll go through a few each evening.', now() - interval '4 days')
on conflict (id) do nothing;

-- Recent job-search activity, so the Crew pulse has something to show. Company names stay private: the pulse only
-- ever says things like "landed an interview".
insert into public.job_applications
  (id, user_id, company, job_title, status, applied_on, created_at, status_changed_at)
values
  ('00000000-0000-4000-a000-000000000001', 'seed|03', 'Northwind', 'Junior Developer', 'interviewing', current_date - 5, now() - interval '5 days', now() - interval '1 day'),
  ('00000000-0000-4000-a000-000000000002', 'seed|03', 'Bluebird Labs', 'Software Developer I', 'applied', current_date - 3, now() - interval '3 days', now() - interval '3 days'),
  ('00000000-0000-4000-a000-000000000003', 'seed|03', 'Prairie Tech', 'Graduate Engineer', 'applied', current_date - 2, now() - interval '2 days', now() - interval '2 days'),
  ('00000000-0000-4000-a000-000000000004', 'seed|02', 'Datastream', 'Data Engineer (contract)', 'applied', current_date - 6, now() - interval '6 days', now() - interval '6 days'),
  ('00000000-0000-4000-a000-000000000005', 'seed|02', 'Fenwick', 'Backend Engineer', 'applied', current_date - 4, now() - interval '4 days', now() - interval '4 days'),
  ('00000000-0000-4000-a000-000000000006', 'seed|02', 'Lumen', 'Platform Engineer', 'applied', current_date - 1, now() - interval '1 day', now() - interval '1 day'),
  ('00000000-0000-4000-a000-000000000007', 'seed|07', 'Talentbridge', 'Senior Recruiter', 'offer', current_date - 20, now() - interval '20 days', now() - interval '2 days'),
  ('00000000-0000-4000-a000-000000000008', 'seed|08', 'Helpwise', 'Support Specialist', 'applied', current_date - 2, now() - interval '2 days', now() - interval '2 days'),
  ('00000000-0000-4000-a000-000000000009', 'seed|08', 'Calgary Transit', 'Customer Service Rep', 'applied', current_date - 1, now() - interval '1 day', now() - interval '1 day'),
  ('00000000-0000-4000-a000-000000000010', 'seed|04', 'Studio North', 'Product Designer', 'interviewing', current_date - 10, now() - interval '10 days', now() - interval '3 days')
on conflict (id) do update set
  status = excluded.status,
  created_at = excluded.created_at,
  status_changed_at = excluded.status_changed_at;

insert into public.wins (user_id, date, title, created_at)
values
  ('seed|01', current_date - 1, 'Update your LinkedIn headline', now() - interval '1 day'),
  ('seed|01', current_date, 'Take a 15-minute walk', now() - interval '2 hours'),
  ('seed|06', current_date - 3, 'Take a 15-minute walk', now() - interval '3 days'),
  ('seed|06', current_date - 2, 'Reply in your crew chat', now() - interval '2 days'),
  ('seed|06', current_date - 1, 'Practise your story out loud', now() - interval '1 day'),
  ('seed|06', current_date, 'Take a 15-minute walk', now() - interval '3 hours'),
  ('seed|08', current_date - 2, 'Apply to 2 roles', now() - interval '2 days'),
  ('seed|08', current_date - 1, 'Ask a former colleague for a reference', now() - interval '1 day'),
  ('seed|08', current_date, 'Update your LinkedIn headline', now() - interval '1 hour')
on conflict do nothing;

commit;

-- ---------------------------------------------------------------------------
-- Optional: send friend requests to YOUR account
-- ---------------------------------------------------------------------------
-- Lets you try Accept / Decline on the Today page. Replace YOUR_AUTH0_ID with
-- your id (Table Editor -> users, the row with your name; it looks like
-- 'auth0|abc123' or 'google-oauth2|123'), then run this part on its own.
--
-- insert into public.friendships (requester_id, addressee_id)
-- values
--   ('seed|03', 'YOUR_AUTH0_ID'),
--   ('seed|08', 'YOUR_AUTH0_ID')
-- on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Remove all test data (friendships and memberships go with them)
-- ---------------------------------------------------------------------------
-- delete from public.crews where id::text like '00000000-0000-4000-8000-%';
-- delete from public.users where id like 'seed|%';
