-- =============================================================================
-- FIX: Admin notification insert policy
-- =============================================================================
-- Problem: The notifications table has SELECT and UPDATE policies for users
-- and admins, but no INSERT policy. When the NotificationService creates
-- notifications via the client SDK (not service_role), RLS blocks the insert
-- because auth.uid() does not match recipient_id (admin inserts for others).
--
-- Solution: Add an INSERT policy that allows authenticated users to insert
-- notifications. The NotificationService runs under the admin's session,
-- and the admin RLS policies already verify their role.
-- =============================================================================

CREATE POLICY "Admins can create notifications"
ON public.notifications
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
    is_admin_user()
);

-- Note: The notifications.type CHECK constraint currently allows these values:
--   'job_request', 'job_accepted', 'job_status', 'contractor_arrived',
--   'payment', 'message', 'system'
--
-- The NotificationService maps all admin events to type 'system' and stores
-- the specific event type in the data JSONB column. This avoids needing to
-- modify the CHECK constraint. If you want to add dedicated admin types:
--
-- ALTER TABLE public.notifications
--   DROP CONSTRAINT notifications_type_check;
-- 
-- ALTER TABLE public.notifications
--   ADD CONSTRAINT notifications_type_check CHECK (
--     type = ANY (ARRAY[
--       'job_request', 'job_accepted', 'job_status', 'contractor_arrived',
--       'payment', 'message', 'system',
--       'kyc_approved', 'kyc_rejected', 'contractor_suspended',
--       'contractor_restored', 'job_cancelled', 'dispute_created',
--       'dispute_resolved', 'refund_completed', 'withdrawal_completed',
--       'support_ticket_created', 'support_ticket_resolved'
--     ])
--   );