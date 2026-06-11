
  create policy "Admins can update jobs"
  on "public"."jobs"
  as permissive
  for update
  to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());



