
  create policy "Admins can insert finance audit logs"
  on "public"."finance_audit_log"
  as permissive
  for insert
  to authenticated
with check ((public.is_admin_user() AND (admin_id = auth.uid())));



