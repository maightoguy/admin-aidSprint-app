-- Add INSERT policy for finance_audit_log
-- Allows admins to insert audit logs with proper admin validation

CREATE POLICY "Admins can insert finance audit logs"
  ON "public"."finance_audit_log"
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
WITH CHECK (
  public.is_admin_user() AND
  admin_id = auth.uid()
);
