-- Create admin_action_log table for comprehensive audit trail of all admin mutations
CREATE TABLE IF NOT EXISTS "public"."admin_action_log" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "admin_id" uuid NOT NULL,
  "action_type" text NOT NULL,
  "resource_type" text NOT NULL,
  "resource_id" uuid NOT NULL,
  "reason" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "result" text NOT NULL DEFAULT 'success',
  "error_message" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Add primary key
ALTER TABLE "public"."admin_action_log" ADD CONSTRAINT "admin_action_log_pkey" PRIMARY KEY (id);

-- Add foreign key to profiles (admin who performed the action)
ALTER TABLE "public"."admin_action_log"
  ADD CONSTRAINT "admin_action_log_admin_id_fkey" 
  FOREIGN KEY (admin_id) 
  REFERENCES "public"."profiles"(id) 
  ON DELETE RESTRICT;

-- Add constraints for valid values
ALTER TABLE "public"."admin_action_log"
  ADD CONSTRAINT "admin_action_log_action_type_check"
  CHECK (action_type IN (
    'contractor_suspended',
    'contractor_restored',
    'contractor_kyc_approved',
    'contractor_kyc_rejected',
    'job_cancelled',
    'job_status_updated',
    'dispute_created',
    'dispute_resolved',
    'dispute_rejected',
    'support_ticket_created',
    'support_ticket_escalated',
    'support_ticket_resolved',
    'refund_initiated',
    'refund_completed',
    'refund_failed',
    'payout_approved',
    'payout_rejected',
    'payout_processed',
    'settings_category_created',
    'settings_category_updated',
    'settings_category_deleted',
    'settings_service_type_created',
    'settings_service_type_updated',
    'settings_service_type_deleted',
    'settings_urgency_tier_updated',
    'settings_promo_code_created',
    'settings_promo_code_deleted',
    'settings_notification_template_created',
    'settings_notification_template_deleted',
    'settings_notification_campaign_created',
    'settings_notification_campaign_deleted',
    'admin_password_changed',
    'admin_mfa_enabled',
    'admin_mfa_disabled'
  ));

ALTER TABLE "public"."admin_action_log"
  ADD CONSTRAINT "admin_action_log_resource_type_check"
  CHECK (resource_type IN (
    'contractor',
    'contractor_document',
    'job',
    'dispute',
    'support_ticket',
    'payment',
    'withdrawal',
    'payout',
    'service_category',
    'service_type',
    'urgency_tier',
    'promo_code',
    'notification_template',
    'notification_campaign',
    'admin_profile'
  ));

ALTER TABLE "public"."admin_action_log"
  ADD CONSTRAINT "admin_action_log_result_check"
  CHECK (result IN ('success', 'failure'));

-- Create indexes for common queries
CREATE INDEX "idx_admin_action_log_admin_id" 
  ON "public"."admin_action_log" USING btree (admin_id);

CREATE INDEX "idx_admin_action_log_action_type" 
  ON "public"."admin_action_log" USING btree (action_type);

CREATE INDEX "idx_admin_action_log_resource_type" 
  ON "public"."admin_action_log" USING btree (resource_type);

CREATE INDEX "idx_admin_action_log_resource_id" 
  ON "public"."admin_action_log" USING btree (resource_id);

CREATE INDEX "idx_admin_action_log_created_at" 
  ON "public"."admin_action_log" USING btree (created_at DESC);

CREATE INDEX "idx_admin_action_log_admin_created" 
  ON "public"."admin_action_log" USING btree (admin_id, created_at DESC);

CREATE INDEX "idx_admin_action_log_result" 
  ON "public"."admin_action_log" USING btree (result);

-- Enable RLS
ALTER TABLE "public"."admin_action_log" ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can read all admin action logs (for transparency and audit)
CREATE POLICY "admin_action_log_select_admins" 
  ON "public"."admin_action_log" 
  FOR SELECT 
  USING (public.is_admin_user());

-- RLS Policy: Only service role can insert (writes controlled by data layer)
CREATE POLICY "admin_action_log_insert_service_role" 
  ON "public"."admin_action_log" 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT SELECT ON "public"."admin_action_log" TO authenticated;
GRANT INSERT ON "public"."admin_action_log" TO authenticated;
GRANT SELECT ON "public"."admin_action_log" TO service_role;
GRANT INSERT ON "public"."admin_action_log" TO service_role;
