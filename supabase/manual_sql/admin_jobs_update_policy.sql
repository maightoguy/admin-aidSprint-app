-- Admin portal writes should continue to use the shared jobs table.
-- This only adds admin update access through RLS; it does not duplicate tables
-- or change the existing mobile-app job status contract.

drop policy if exists "Admins can update jobs" on public.jobs;
create policy "Admins can update jobs"
on public.jobs
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());
