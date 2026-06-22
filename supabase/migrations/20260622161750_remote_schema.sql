
  create policy "Admins can insert job operations"
  on "public"."job_operations_log"
  as permissive
  for insert
  to authenticated
with check ((public.is_admin_user() AND (actor_id = auth.uid())));



  create policy "Admins can read job operations logs"
  on "public"."job_operations_log"
  as permissive
  for select
  to authenticated
using (public.is_admin_user());



  create policy "job_operations_log_is_immutable"
  on "public"."job_operations_log"
  as permissive
  for update
  to public
using (false);



  create policy "job_operations_log_no_delete"
  on "public"."job_operations_log"
  as permissive
  for delete
  to public
using (false);



