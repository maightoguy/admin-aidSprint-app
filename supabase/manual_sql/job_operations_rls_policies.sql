-- RLS Policies for job_operations_log table
-- Allows admins to read all operations and write new operations with actor validation

-- Policy 1: Admins can read all job operations logs
CREATE POLICY "Admins can read job operations logs" ON public.job_operations_log
FOR SELECT
TO authenticated
USING (
  public.is_admin_user()
);

-- Policy 2: Admins can insert job operations logs (with actor validation)
CREATE POLICY "Admins can insert job operations" ON public.job_operations_log
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_user() AND
  actor_id = auth.uid()
);

-- Policy 3: Prevent updates to immutable audit records
ALTER TABLE public.job_operations_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_operations_log_is_immutable" ON public.job_operations_log
FOR UPDATE
USING (false);

-- Policy 4: Prevent deletes on audit records
CREATE POLICY "job_operations_log_no_delete" ON public.job_operations_log
FOR DELETE
USING (false);
