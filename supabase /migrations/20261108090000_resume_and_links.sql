-- Resume upload and profile links, asked for near the end of onboarding.
--
-- Resumes live in the private `resumes` bucket at <folder>/resume.pdf, where
-- <folder> is the person's Auth0 ID hex-encoded (Storage doesn't allow the `|`
-- in IDs like 'auth0|abc123'). Only the owner can read or replace theirs.
--
-- The size limit and type must match frontend/src/resume.ts, and so must the
-- link checks below.

begin;

-- ---------------------------------------------------------------------------
-- Bucket
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', false, 5242880, array['application/pdf']) -- 5 MB
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- The signed-in person's folder in the bucket.
create function public.my_file_folder()
returns text
language sql
stable
set search_path = ''
as $$
  select encode(convert_to(auth.jwt() ->> 'sub', 'UTF8'), 'hex');
$$;

revoke all on function public.my_file_folder() from public, anon;
grant execute on function public.my_file_folder() to authenticated;

-- Replacing a resume is an upsert, which needs insert, select and update.
create policy "Users can upload their own resume"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = public.my_file_folder()
  );
create policy "Users can view their own resume"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = public.my_file_folder()
  );
create policy "Users can replace their own resume"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = public.my_file_folder()
  )
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = public.my_file_folder()
  );
create policy "Users can delete their own resume"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = public.my_file_folder()
  );

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

alter table public.users
  add column linkedin_url text check (
    length(linkedin_url) <= 300
    and linkedin_url ~* '^https://([a-z0-9-]+\.)*linkedin\.com(/|$)'
  ),
  add column github_url text check (
    length(github_url) <= 300
    and github_url ~* '^https://(www\.)?github\.com/[a-z0-9-]+'
  ),
  add column website_url text check (
    length(website_url) <= 300
    and website_url ~* '^https?://[^/[:space:]]+\.[^[:space:]]*$'
  ),
  -- Set only by set_resume(), after the upload has finished.
  add column resume_path text,
  add column resume_name text check (length(resume_name) <= 200),
  add column resume_uploaded_at timestamptz;

grant update (linkedin_url, github_url, website_url) on public.users to authenticated;

-- ---------------------------------------------------------------------------
-- Functions the app calls
-- ---------------------------------------------------------------------------

-- Upload to <folder>/resume.pdf first, then call this with the file's original
-- name. It checks the upload really exists before pointing the profile at it.
create function public.set_resume(new_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id text := auth.jwt() ->> 'sub';
  resume_object text;
begin
  if current_user_id is null then
    raise exception 'Not signed in';
  end if;

  resume_object := encode(convert_to(current_user_id, 'UTF8'), 'hex') || '/resume.pdf';

  if not exists (
    select 1 from storage.objects as o
    where o.bucket_id = 'resumes' and o.name = resume_object
  ) then
    raise exception 'Your resume didn''t finish uploading';
  end if;

  update public.users
  set resume_path = resume_object,
      resume_name = left(coalesce(nullif(trim(new_name), ''), 'Resume.pdf'), 200),
      resume_uploaded_at = now()
  where id = current_user_id;

  if not found then
    raise exception 'Account not found';
  end if;
end;
$$;

revoke all on function public.set_resume(text) from public, anon;
grant execute on function public.set_resume(text) to authenticated;

commit;
