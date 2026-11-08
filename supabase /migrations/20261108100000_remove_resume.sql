-- Lets people remove their resume from the Profile page.
--
-- Supabase doesn't allow deleting Storage files with SQL, so the app deletes
-- <folder>/resume.pdf through the Storage API first (the delete policy is in
-- 20261108090000_resume_and_links.sql), then calls this to clear the profile.

begin;

create function public.clear_resume()
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

  update public.users
  set resume_path = null,
      resume_name = null,
      resume_uploaded_at = null
  where id = current_user_id;
end;
$$;

revoke all on function public.clear_resume() from public, anon;
grant execute on function public.clear_resume() to authenticated;

commit;
