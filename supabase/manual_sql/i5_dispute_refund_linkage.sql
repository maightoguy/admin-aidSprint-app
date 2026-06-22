-- I5: Dispute refund linkage and payment reversal coordination
-- Extends disputes and payments tables to track refund status and coordination

-- Add refund_status column to disputes
-- Tracks the state of refunds: pending (awaiting processing), processing (in-flight), completed (success), failed (error)
ALTER TABLE "public"."disputes" 
ADD COLUMN "refund_status" TEXT DEFAULT NULL,
ADD CONSTRAINT "disputes_refund_status_check" CHECK (refund_status IS NULL OR refund_status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text]));

-- Add refund tracking columns to payments
-- Tracks which admin initiated the refund and why (for audit trail)
ALTER TABLE "public"."payments"
ADD COLUMN "refund_initiated_by" UUID DEFAULT NULL,
ADD COLUMN "refund_reason" TEXT DEFAULT NULL,
ADD CONSTRAINT "payments_refund_initiated_by_fkey" FOREIGN KEY (refund_initiated_by) REFERENCES "public"."profiles"(id);

-- Add indexes for efficient refund tracking and auditing
CREATE INDEX "idx_disputes_refund_status" ON "public"."disputes" (refund_status) WHERE refund_status IS NOT NULL;
CREATE INDEX "idx_disputes_related_payment_id" ON "public"."disputes" (related_payment_id) WHERE related_payment_id IS NOT NULL;
CREATE INDEX "idx_payments_refund_initiated_by" ON "public"."payments" (refund_initiated_by) WHERE refund_initiated_by IS NOT NULL;

-- Create finance_audit_log table for tracking all finance operations (refunds, reversals, etc)
-- This table serves as a comprehensive audit trail for finance admin actions
CREATE TABLE IF NOT EXISTS "public"."finance_audit_log" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "admin_id" UUID NOT NULL REFERENCES "public"."profiles"(id),
  "action" TEXT NOT NULL CHECK (action = ANY (ARRAY['refund_initiated'::text, 'refund_completed'::text, 'refund_failed'::text, 'reversal_initiated'::text, 'chargeback_initiated'::text])),
  "dispute_id" UUID REFERENCES "public"."disputes"(id) ON DELETE SET NULL,
  "payment_id" UUID REFERENCES "public"."payments"(id) ON DELETE SET NULL,
  "amount" NUMERIC(10, 2),
  "reason" TEXT,
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Add indexes for finance audit log querying
CREATE INDEX "idx_finance_audit_log_admin" ON "public"."finance_audit_log" (admin_id);
CREATE INDEX "idx_finance_audit_log_action" ON "public"."finance_audit_log" (action);
CREATE INDEX "idx_finance_audit_log_dispute" ON "public"."finance_audit_log" (dispute_id) WHERE dispute_id IS NOT NULL;
CREATE INDEX "idx_finance_audit_log_payment" ON "public"."finance_audit_log" (payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX "idx_finance_audit_log_created" ON "public"."finance_audit_log" (created_at DESC);

-- Enable RLS on finance_audit_log
ALTER TABLE "public"."finance_audit_log" ENABLE ROW LEVEL SECURITY;

-- Admin-only read access to finance audit log (for compliance and investigation)
CREATE POLICY "Admins can view finance audit log"
ON "public"."finance_audit_log"
FOR SELECT
USING (public.is_admin_user());

-- Add refund_status to disputes_status_check constraint validation
-- (The refund_status is separate from dispute status since a dispute can be "resolved" with "pending" refund)

-- Add update policy to allow admins to update refund-related fields on payments
CREATE POLICY "Admins can update refund fields on payments"
ON "public"."payments"
FOR UPDATE
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Add update policy to allow admins to update refund_status on disputes
CREATE POLICY "Admins can update refund status on disputes"
ON "public"."disputes"
FOR UPDATE
USING (public.is_admin_user() AND resolution_type = ANY (ARRAY['refund'::text, 'partial_refund'::text]))
WITH CHECK (public.is_admin_user());

-- Validate constraints
ALTER TABLE "public"."finance_audit_log" VALIDATE CONSTRAINT "finance_audit_log_action_check";
ALTER TABLE "public"."disputes" VALIDATE CONSTRAINT "disputes_refund_status_check";
ALTER TABLE "public"."payments" VALIDATE CONSTRAINT "payments_refund_initiated_by_fkey";
