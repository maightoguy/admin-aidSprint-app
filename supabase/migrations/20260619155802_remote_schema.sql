drop trigger if exists "set_admin_security_settings_updated_at" on "public"."admin_security_settings";

drop trigger if exists "set_chat_conversations_updated_at" on "public"."chat_conversations";

drop trigger if exists "on_contractor_verification_update" on "public"."contractors";

drop trigger if exists "set_contractors_updated_at" on "public"."contractors";

drop trigger if exists "on_job_broadcast_notify_contractors" on "public"."jobs";

drop trigger if exists "on_job_completed_close_chat" on "public"."jobs";

drop trigger if exists "on_job_status_changed" on "public"."jobs";

drop trigger if exists "set_jobs_updated_at" on "public"."jobs";

drop trigger if exists "set_notification_campaigns_updated_at" on "public"."notification_campaigns";

drop trigger if exists "set_notification_templates_updated_at" on "public"."notification_templates";

drop trigger if exists "set_payments_updated_at" on "public"."payments";

drop trigger if exists "on_profile_role_sync_contractor" on "public"."profiles";

drop trigger if exists "set_profiles_updated_at" on "public"."profiles";

drop trigger if exists "set_promo_codes_updated_at" on "public"."promo_codes";

drop trigger if exists "on_review_created" on "public"."reviews";

drop policy "Admins can delete own MFA recovery codes" on "public"."admin_mfa_recovery_codes";

drop policy "Admins can insert own MFA recovery codes" on "public"."admin_mfa_recovery_codes";

drop policy "Admins can update own MFA recovery codes" on "public"."admin_mfa_recovery_codes";

drop policy "Admins can view own MFA recovery codes" on "public"."admin_mfa_recovery_codes";

drop policy "Admins can insert own security events" on "public"."admin_security_events";

drop policy "Admins can view own security events" on "public"."admin_security_events";

drop policy "Admins can insert own security settings" on "public"."admin_security_settings";

drop policy "Admins can update own security settings" on "public"."admin_security_settings";

drop policy "Admins can view own security settings" on "public"."admin_security_settings";

drop policy "Chat participants can send messages" on "public"."chat_messages";

drop policy "Chat participants can view messages" on "public"."chat_messages";

drop policy "Recipients can mark messages read" on "public"."chat_messages";

drop policy "Admins can view contractor bank accounts" on "public"."contractor_bank_accounts";

drop policy "Admins can review contractor documents" on "public"."contractor_documents";

drop policy "Admins can view contractor documents" on "public"."contractor_documents";

drop policy "Admins can update contractors" on "public"."contractors";

drop policy "Admins can insert dispute events" on "public"."dispute_events";

drop policy "Admins can update dispute events" on "public"."dispute_events";

drop policy "Admins can view dispute events" on "public"."dispute_events";

drop policy "Admins can insert dispute evidence" on "public"."dispute_evidence";

drop policy "Admins can update dispute evidence" on "public"."dispute_evidence";

drop policy "Admins can view dispute evidence" on "public"."dispute_evidence";

drop policy "Admins can insert disputes" on "public"."disputes";

drop policy "Admins can update disputes" on "public"."disputes";

drop policy "Admins can view disputes" on "public"."disputes";

drop policy "Admins can insert finance admin events" on "public"."finance_admin_events";

drop policy "Admins can view finance admin events" on "public"."finance_admin_events";

drop policy "Job participants can view attachments" on "public"."job_attachments";

drop policy "Declined visible to job owner and contractor" on "public"."job_declined_contractors";

drop policy "Admins can update jobs" on "public"."jobs";

drop policy "Admins can view jobs" on "public"."jobs";

drop policy "Contractors can view available and assigned jobs" on "public"."jobs";

drop policy "Admins can delete notification campaigns" on "public"."notification_campaigns";

drop policy "Admins can insert notification campaigns" on "public"."notification_campaigns";

drop policy "Admins can update notification campaigns" on "public"."notification_campaigns";

drop policy "Admins can view notification campaigns" on "public"."notification_campaigns";

drop policy "Admins can insert notification deliveries" on "public"."notification_deliveries";

drop policy "Admins can update notification deliveries" on "public"."notification_deliveries";

drop policy "Admins can view notification deliveries" on "public"."notification_deliveries";

drop policy "Admins can delete notification templates" on "public"."notification_templates";

drop policy "Admins can insert notification templates" on "public"."notification_templates";

drop policy "Admins can update notification templates" on "public"."notification_templates";

drop policy "Admins can view notification templates" on "public"."notification_templates";

drop policy "Admins can view notifications" on "public"."notifications";

drop policy "Admins can view payments" on "public"."payments";

drop policy "Admins can insert platform config" on "public"."platform_config";

drop policy "Admins can update platform config" on "public"."platform_config";

drop policy "Admins can insert promo code redemptions" on "public"."promo_code_redemptions";

drop policy "Admins can update promo code redemptions" on "public"."promo_code_redemptions";

drop policy "Admins can view promo code redemptions" on "public"."promo_code_redemptions";

drop policy "Admins can delete promo codes" on "public"."promo_codes";

drop policy "Admins can insert promo codes" on "public"."promo_codes";

drop policy "Admins can update promo codes" on "public"."promo_codes";

drop policy "Admins can view promo codes" on "public"."promo_codes";

drop policy "Users can create reviews for their jobs" on "public"."reviews";

drop policy "Admins can insert service categories" on "public"."service_categories";

drop policy "Admins can update service categories" on "public"."service_categories";

drop policy "Admins can insert service types" on "public"."service_types";

drop policy "Admins can update service types" on "public"."service_types";

drop policy "Admins can insert support ticket events" on "public"."support_ticket_events";

drop policy "Admins can update support ticket events" on "public"."support_ticket_events";

drop policy "Admins can view support ticket events" on "public"."support_ticket_events";

drop policy "Admins can insert support tickets" on "public"."support_tickets";

drop policy "Admins can update support tickets" on "public"."support_tickets";

drop policy "Admins can view support tickets" on "public"."support_tickets";

drop policy "Admins can insert urgency tiers" on "public"."urgency_tiers";

drop policy "Admins can update urgency tiers" on "public"."urgency_tiers";

drop policy "Admins can view withdrawals" on "public"."withdrawals";

alter table "public"."admin_mfa_recovery_codes" drop constraint "admin_mfa_recovery_codes_admin_user_id_fkey";

alter table "public"."admin_security_events" drop constraint "admin_security_events_actor_id_fkey";

alter table "public"."admin_security_events" drop constraint "admin_security_events_admin_user_id_fkey";

alter table "public"."admin_security_settings" drop constraint "admin_security_settings_admin_user_id_fkey";

alter table "public"."admin_security_settings" drop constraint "admin_security_settings_last_mfa_reset_by_fkey";

alter table "public"."chat_conversations" drop constraint "chat_conversations_contractor_id_fkey";

alter table "public"."chat_conversations" drop constraint "chat_conversations_job_id_fkey";

alter table "public"."chat_conversations" drop constraint "chat_conversations_user_id_fkey";

alter table "public"."chat_messages" drop constraint "chat_messages_conversation_id_fkey";

alter table "public"."chat_messages" drop constraint "chat_messages_sender_id_fkey";

alter table "public"."contractor_bank_accounts" drop constraint "contractor_bank_accounts_contractor_id_fkey";

alter table "public"."contractor_documents" drop constraint "contractor_documents_contractor_id_fkey";

alter table "public"."contractor_documents" drop constraint "contractor_documents_reviewed_by_fkey";

alter table "public"."contractors" drop constraint "contractors_id_fkey";

alter table "public"."contractors" drop constraint "contractors_restored_by_fkey";

alter table "public"."contractors" drop constraint "contractors_suspended_by_fkey";

alter table "public"."dispute_events" drop constraint "dispute_events_actor_id_fkey";

alter table "public"."dispute_events" drop constraint "dispute_events_dispute_id_fkey";

alter table "public"."dispute_evidence" drop constraint "dispute_evidence_dispute_id_fkey";

alter table "public"."dispute_evidence" drop constraint "dispute_evidence_submitted_by_id_fkey";

alter table "public"."disputes" drop constraint "disputes_assigned_admin_id_fkey";

alter table "public"."disputes" drop constraint "disputes_job_id_fkey";

alter table "public"."disputes" drop constraint "disputes_opened_by_id_fkey";

alter table "public"."disputes" drop constraint "disputes_related_payment_id_fkey";

alter table "public"."disputes" drop constraint "disputes_related_withdrawal_id_fkey";

alter table "public"."finance_admin_events" drop constraint "finance_admin_events_actor_id_fkey";

alter table "public"."finance_admin_events" drop constraint "finance_admin_events_payment_id_fkey";

alter table "public"."finance_admin_events" drop constraint "finance_admin_events_withdrawal_id_fkey";

alter table "public"."job_attachments" drop constraint "job_attachments_job_id_fkey";

alter table "public"."job_attachments" drop constraint "job_attachments_uploaded_by_fkey";

alter table "public"."job_declined_contractors" drop constraint "job_declined_contractors_contractor_id_fkey";

alter table "public"."job_declined_contractors" drop constraint "job_declined_contractors_job_id_fkey";

alter table "public"."jobs" drop constraint "jobs_cancelled_by_fkey";

alter table "public"."jobs" drop constraint "jobs_contractor_id_fkey";

alter table "public"."jobs" drop constraint "jobs_service_category_id_fkey";

alter table "public"."jobs" drop constraint "jobs_service_type_id_fkey";

alter table "public"."jobs" drop constraint "jobs_user_id_fkey";

alter table "public"."notification_campaigns" drop constraint "notification_campaigns_created_by_admin_id_fkey";

alter table "public"."notification_campaigns" drop constraint "notification_campaigns_template_id_fkey";

alter table "public"."notification_campaigns" drop constraint "notification_campaigns_updated_by_admin_id_fkey";

alter table "public"."notification_deliveries" drop constraint "notification_deliveries_campaign_id_fkey";

alter table "public"."notification_deliveries" drop constraint "notification_deliveries_recipient_id_fkey";

alter table "public"."notification_deliveries" drop constraint "notification_deliveries_template_id_fkey";

alter table "public"."notification_templates" drop constraint "notification_templates_created_by_admin_id_fkey";

alter table "public"."notification_templates" drop constraint "notification_templates_updated_by_admin_id_fkey";

alter table "public"."notifications" drop constraint "notifications_recipient_id_fkey";

alter table "public"."payments" drop constraint "payments_job_id_fkey";

alter table "public"."payments" drop constraint "payments_payee_id_fkey";

alter table "public"."payments" drop constraint "payments_payer_id_fkey";

alter table "public"."promo_code_redemptions" drop constraint "promo_code_redemptions_promo_code_id_fkey";

alter table "public"."promo_code_redemptions" drop constraint "promo_code_redemptions_user_id_fkey";

alter table "public"."promo_codes" drop constraint "promo_codes_created_by_admin_id_fkey";

alter table "public"."promo_codes" drop constraint "promo_codes_updated_by_admin_id_fkey";

alter table "public"."reviews" drop constraint "reviews_job_id_fkey";

alter table "public"."reviews" drop constraint "reviews_reviewee_id_fkey";

alter table "public"."reviews" drop constraint "reviews_reviewer_id_fkey";

alter table "public"."service_types" drop constraint "service_types_category_id_fkey";

alter table "public"."support_ticket_events" drop constraint "support_ticket_events_actor_id_fkey";

alter table "public"."support_ticket_events" drop constraint "support_ticket_events_ticket_id_fkey";

alter table "public"."support_tickets" drop constraint "support_tickets_assigned_admin_id_fkey";

alter table "public"."support_tickets" drop constraint "support_tickets_job_id_fkey";

alter table "public"."support_tickets" drop constraint "support_tickets_requester_id_fkey";

alter table "public"."withdrawals" drop constraint "withdrawals_bank_account_id_fkey";

alter table "public"."withdrawals" drop constraint "withdrawals_contractor_id_fkey";

drop function if exists "public"."is_contractor_eligible_for_job"(p_job jobs, p_radius_km double precision);


  create table "public"."support_ticket_messages" (
    "id" uuid not null default gen_random_uuid(),
    "ticket_id" uuid not null,
    "sender_id" uuid not null,
    "sender_role" text not null,
    "content" text not null,
    "read_by_admins" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."support_ticket_messages" enable row level security;

CREATE UNIQUE INDEX support_ticket_messages_pkey ON public.support_ticket_messages USING btree (id);

CREATE INDEX support_ticket_messages_sender_id_idx ON public.support_ticket_messages USING btree (sender_id);

CREATE INDEX support_ticket_messages_ticket_id_idx ON public.support_ticket_messages USING btree (ticket_id, created_at);

alter table "public"."support_ticket_messages" add constraint "support_ticket_messages_pkey" PRIMARY KEY using index "support_ticket_messages_pkey";

alter table "public"."support_ticket_messages" add constraint "support_ticket_messages_content_not_empty" CHECK ((length(TRIM(BOTH FROM content)) > 0)) not valid;

alter table "public"."support_ticket_messages" validate constraint "support_ticket_messages_content_not_empty";

alter table "public"."support_ticket_messages" add constraint "support_ticket_messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES public.profiles(id) not valid;

alter table "public"."support_ticket_messages" validate constraint "support_ticket_messages_sender_id_fkey";

alter table "public"."support_ticket_messages" add constraint "support_ticket_messages_sender_role_check" CHECK ((sender_role = ANY (ARRAY['admin'::text, 'user'::text, 'contractor'::text]))) not valid;

alter table "public"."support_ticket_messages" validate constraint "support_ticket_messages_sender_role_check";

alter table "public"."support_ticket_messages" add constraint "support_ticket_messages_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE not valid;

alter table "public"."support_ticket_messages" validate constraint "support_ticket_messages_ticket_id_fkey";

alter table "public"."admin_mfa_recovery_codes" add constraint "admin_mfa_recovery_codes_admin_user_id_fkey" FOREIGN KEY (admin_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."admin_mfa_recovery_codes" validate constraint "admin_mfa_recovery_codes_admin_user_id_fkey";

alter table "public"."admin_security_events" add constraint "admin_security_events_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.profiles(id) not valid;

alter table "public"."admin_security_events" validate constraint "admin_security_events_actor_id_fkey";

alter table "public"."admin_security_events" add constraint "admin_security_events_admin_user_id_fkey" FOREIGN KEY (admin_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."admin_security_events" validate constraint "admin_security_events_admin_user_id_fkey";

alter table "public"."admin_security_settings" add constraint "admin_security_settings_admin_user_id_fkey" FOREIGN KEY (admin_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."admin_security_settings" validate constraint "admin_security_settings_admin_user_id_fkey";

alter table "public"."admin_security_settings" add constraint "admin_security_settings_last_mfa_reset_by_fkey" FOREIGN KEY (last_mfa_reset_by) REFERENCES public.profiles(id) not valid;

alter table "public"."admin_security_settings" validate constraint "admin_security_settings_last_mfa_reset_by_fkey";

alter table "public"."chat_conversations" add constraint "chat_conversations_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES public.profiles(id) not valid;

alter table "public"."chat_conversations" validate constraint "chat_conversations_contractor_id_fkey";

alter table "public"."chat_conversations" add constraint "chat_conversations_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE not valid;

alter table "public"."chat_conversations" validate constraint "chat_conversations_job_id_fkey";

alter table "public"."chat_conversations" add constraint "chat_conversations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) not valid;

alter table "public"."chat_conversations" validate constraint "chat_conversations_user_id_fkey";

alter table "public"."chat_messages" add constraint "chat_messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE not valid;

alter table "public"."chat_messages" validate constraint "chat_messages_conversation_id_fkey";

alter table "public"."chat_messages" add constraint "chat_messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES public.profiles(id) not valid;

alter table "public"."chat_messages" validate constraint "chat_messages_sender_id_fkey";

alter table "public"."contractor_bank_accounts" add constraint "contractor_bank_accounts_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES public.contractors(id) ON DELETE CASCADE not valid;

alter table "public"."contractor_bank_accounts" validate constraint "contractor_bank_accounts_contractor_id_fkey";

alter table "public"."contractor_documents" add constraint "contractor_documents_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES public.contractors(id) ON DELETE CASCADE not valid;

alter table "public"."contractor_documents" validate constraint "contractor_documents_contractor_id_fkey";

alter table "public"."contractor_documents" add constraint "contractor_documents_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id) not valid;

alter table "public"."contractor_documents" validate constraint "contractor_documents_reviewed_by_fkey";

alter table "public"."contractors" add constraint "contractors_id_fkey" FOREIGN KEY (id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."contractors" validate constraint "contractors_id_fkey";

alter table "public"."contractors" add constraint "contractors_restored_by_fkey" FOREIGN KEY (restored_by) REFERENCES public.profiles(id) not valid;

alter table "public"."contractors" validate constraint "contractors_restored_by_fkey";

alter table "public"."contractors" add constraint "contractors_suspended_by_fkey" FOREIGN KEY (suspended_by) REFERENCES public.profiles(id) not valid;

alter table "public"."contractors" validate constraint "contractors_suspended_by_fkey";

alter table "public"."dispute_events" add constraint "dispute_events_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.profiles(id) not valid;

alter table "public"."dispute_events" validate constraint "dispute_events_actor_id_fkey";

alter table "public"."dispute_events" add constraint "dispute_events_dispute_id_fkey" FOREIGN KEY (dispute_id) REFERENCES public.disputes(id) ON DELETE CASCADE not valid;

alter table "public"."dispute_events" validate constraint "dispute_events_dispute_id_fkey";

alter table "public"."dispute_evidence" add constraint "dispute_evidence_dispute_id_fkey" FOREIGN KEY (dispute_id) REFERENCES public.disputes(id) ON DELETE CASCADE not valid;

alter table "public"."dispute_evidence" validate constraint "dispute_evidence_dispute_id_fkey";

alter table "public"."dispute_evidence" add constraint "dispute_evidence_submitted_by_id_fkey" FOREIGN KEY (submitted_by_id) REFERENCES public.profiles(id) not valid;

alter table "public"."dispute_evidence" validate constraint "dispute_evidence_submitted_by_id_fkey";

alter table "public"."disputes" add constraint "disputes_assigned_admin_id_fkey" FOREIGN KEY (assigned_admin_id) REFERENCES public.profiles(id) not valid;

alter table "public"."disputes" validate constraint "disputes_assigned_admin_id_fkey";

alter table "public"."disputes" add constraint "disputes_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE not valid;

alter table "public"."disputes" validate constraint "disputes_job_id_fkey";

alter table "public"."disputes" add constraint "disputes_opened_by_id_fkey" FOREIGN KEY (opened_by_id) REFERENCES public.profiles(id) not valid;

alter table "public"."disputes" validate constraint "disputes_opened_by_id_fkey";

alter table "public"."disputes" add constraint "disputes_related_payment_id_fkey" FOREIGN KEY (related_payment_id) REFERENCES public.payments(id) ON DELETE SET NULL not valid;

alter table "public"."disputes" validate constraint "disputes_related_payment_id_fkey";

alter table "public"."disputes" add constraint "disputes_related_withdrawal_id_fkey" FOREIGN KEY (related_withdrawal_id) REFERENCES public.withdrawals(id) ON DELETE SET NULL not valid;

alter table "public"."disputes" validate constraint "disputes_related_withdrawal_id_fkey";

alter table "public"."finance_admin_events" add constraint "finance_admin_events_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.profiles(id) not valid;

alter table "public"."finance_admin_events" validate constraint "finance_admin_events_actor_id_fkey";

alter table "public"."finance_admin_events" add constraint "finance_admin_events_payment_id_fkey" FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE not valid;

alter table "public"."finance_admin_events" validate constraint "finance_admin_events_payment_id_fkey";

alter table "public"."finance_admin_events" add constraint "finance_admin_events_withdrawal_id_fkey" FOREIGN KEY (withdrawal_id) REFERENCES public.withdrawals(id) ON DELETE CASCADE not valid;

alter table "public"."finance_admin_events" validate constraint "finance_admin_events_withdrawal_id_fkey";

alter table "public"."job_attachments" add constraint "job_attachments_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE not valid;

alter table "public"."job_attachments" validate constraint "job_attachments_job_id_fkey";

alter table "public"."job_attachments" add constraint "job_attachments_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) not valid;

alter table "public"."job_attachments" validate constraint "job_attachments_uploaded_by_fkey";

alter table "public"."job_declined_contractors" add constraint "job_declined_contractors_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES public.profiles(id) not valid;

alter table "public"."job_declined_contractors" validate constraint "job_declined_contractors_contractor_id_fkey";

alter table "public"."job_declined_contractors" add constraint "job_declined_contractors_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE not valid;

alter table "public"."job_declined_contractors" validate constraint "job_declined_contractors_job_id_fkey";

alter table "public"."jobs" add constraint "jobs_cancelled_by_fkey" FOREIGN KEY (cancelled_by) REFERENCES public.profiles(id) not valid;

alter table "public"."jobs" validate constraint "jobs_cancelled_by_fkey";

alter table "public"."jobs" add constraint "jobs_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES public.profiles(id) not valid;

alter table "public"."jobs" validate constraint "jobs_contractor_id_fkey";

alter table "public"."jobs" add constraint "jobs_service_category_id_fkey" FOREIGN KEY (service_category_id) REFERENCES public.service_categories(id) not valid;

alter table "public"."jobs" validate constraint "jobs_service_category_id_fkey";

alter table "public"."jobs" add constraint "jobs_service_type_id_fkey" FOREIGN KEY (service_type_id) REFERENCES public.service_types(id) not valid;

alter table "public"."jobs" validate constraint "jobs_service_type_id_fkey";

alter table "public"."jobs" add constraint "jobs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) not valid;

alter table "public"."jobs" validate constraint "jobs_user_id_fkey";

alter table "public"."notification_campaigns" add constraint "notification_campaigns_created_by_admin_id_fkey" FOREIGN KEY (created_by_admin_id) REFERENCES public.profiles(id) not valid;

alter table "public"."notification_campaigns" validate constraint "notification_campaigns_created_by_admin_id_fkey";

alter table "public"."notification_campaigns" add constraint "notification_campaigns_template_id_fkey" FOREIGN KEY (template_id) REFERENCES public.notification_templates(id) ON DELETE SET NULL not valid;

alter table "public"."notification_campaigns" validate constraint "notification_campaigns_template_id_fkey";

alter table "public"."notification_campaigns" add constraint "notification_campaigns_updated_by_admin_id_fkey" FOREIGN KEY (updated_by_admin_id) REFERENCES public.profiles(id) not valid;

alter table "public"."notification_campaigns" validate constraint "notification_campaigns_updated_by_admin_id_fkey";

alter table "public"."notification_deliveries" add constraint "notification_deliveries_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES public.notification_campaigns(id) ON DELETE SET NULL not valid;

alter table "public"."notification_deliveries" validate constraint "notification_deliveries_campaign_id_fkey";

alter table "public"."notification_deliveries" add constraint "notification_deliveries_recipient_id_fkey" FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."notification_deliveries" validate constraint "notification_deliveries_recipient_id_fkey";

alter table "public"."notification_deliveries" add constraint "notification_deliveries_template_id_fkey" FOREIGN KEY (template_id) REFERENCES public.notification_templates(id) ON DELETE SET NULL not valid;

alter table "public"."notification_deliveries" validate constraint "notification_deliveries_template_id_fkey";

alter table "public"."notification_templates" add constraint "notification_templates_created_by_admin_id_fkey" FOREIGN KEY (created_by_admin_id) REFERENCES public.profiles(id) not valid;

alter table "public"."notification_templates" validate constraint "notification_templates_created_by_admin_id_fkey";

alter table "public"."notification_templates" add constraint "notification_templates_updated_by_admin_id_fkey" FOREIGN KEY (updated_by_admin_id) REFERENCES public.profiles(id) not valid;

alter table "public"."notification_templates" validate constraint "notification_templates_updated_by_admin_id_fkey";

alter table "public"."notifications" add constraint "notifications_recipient_id_fkey" FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) not valid;

alter table "public"."notifications" validate constraint "notifications_recipient_id_fkey";

alter table "public"."payments" add constraint "payments_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) not valid;

alter table "public"."payments" validate constraint "payments_job_id_fkey";

alter table "public"."payments" add constraint "payments_payee_id_fkey" FOREIGN KEY (payee_id) REFERENCES public.profiles(id) not valid;

alter table "public"."payments" validate constraint "payments_payee_id_fkey";

alter table "public"."payments" add constraint "payments_payer_id_fkey" FOREIGN KEY (payer_id) REFERENCES public.profiles(id) not valid;

alter table "public"."payments" validate constraint "payments_payer_id_fkey";

alter table "public"."promo_code_redemptions" add constraint "promo_code_redemptions_promo_code_id_fkey" FOREIGN KEY (promo_code_id) REFERENCES public.promo_codes(id) ON DELETE CASCADE not valid;

alter table "public"."promo_code_redemptions" validate constraint "promo_code_redemptions_promo_code_id_fkey";

alter table "public"."promo_code_redemptions" add constraint "promo_code_redemptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."promo_code_redemptions" validate constraint "promo_code_redemptions_user_id_fkey";

alter table "public"."promo_codes" add constraint "promo_codes_created_by_admin_id_fkey" FOREIGN KEY (created_by_admin_id) REFERENCES public.profiles(id) not valid;

alter table "public"."promo_codes" validate constraint "promo_codes_created_by_admin_id_fkey";

alter table "public"."promo_codes" add constraint "promo_codes_updated_by_admin_id_fkey" FOREIGN KEY (updated_by_admin_id) REFERENCES public.profiles(id) not valid;

alter table "public"."promo_codes" validate constraint "promo_codes_updated_by_admin_id_fkey";

alter table "public"."reviews" add constraint "reviews_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) not valid;

alter table "public"."reviews" validate constraint "reviews_job_id_fkey";

alter table "public"."reviews" add constraint "reviews_reviewee_id_fkey" FOREIGN KEY (reviewee_id) REFERENCES public.profiles(id) not valid;

alter table "public"."reviews" validate constraint "reviews_reviewee_id_fkey";

alter table "public"."reviews" add constraint "reviews_reviewer_id_fkey" FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id) not valid;

alter table "public"."reviews" validate constraint "reviews_reviewer_id_fkey";

alter table "public"."service_types" add constraint "service_types_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.service_categories(id) ON DELETE CASCADE not valid;

alter table "public"."service_types" validate constraint "service_types_category_id_fkey";

alter table "public"."support_ticket_events" add constraint "support_ticket_events_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.profiles(id) not valid;

alter table "public"."support_ticket_events" validate constraint "support_ticket_events_actor_id_fkey";

alter table "public"."support_ticket_events" add constraint "support_ticket_events_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE not valid;

alter table "public"."support_ticket_events" validate constraint "support_ticket_events_ticket_id_fkey";

alter table "public"."support_tickets" add constraint "support_tickets_assigned_admin_id_fkey" FOREIGN KEY (assigned_admin_id) REFERENCES public.profiles(id) not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_assigned_admin_id_fkey";

alter table "public"."support_tickets" add constraint "support_tickets_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_job_id_fkey";

alter table "public"."support_tickets" add constraint "support_tickets_requester_id_fkey" FOREIGN KEY (requester_id) REFERENCES public.profiles(id) not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_requester_id_fkey";

alter table "public"."withdrawals" add constraint "withdrawals_bank_account_id_fkey" FOREIGN KEY (bank_account_id) REFERENCES public.contractor_bank_accounts(id) not valid;

alter table "public"."withdrawals" validate constraint "withdrawals_bank_account_id_fkey";

alter table "public"."withdrawals" add constraint "withdrawals_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES public.contractors(id) not valid;

alter table "public"."withdrawals" validate constraint "withdrawals_contractor_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_contractor_eligible_for_job(p_job public.jobs, p_radius_km double precision DEFAULT 15)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.contractors AS contractor
    WHERE contractor.id = auth.uid()
      AND contractor.availability_status = 'online'
      AND contractor.is_verified = true
      AND contractor.current_latitude IS NOT NULL
      AND contractor.current_longitude IS NOT NULL
      AND NOT (p_job.latitude = 0 AND p_job.longitude = 0)
      AND (
        EXISTS (
          SELECT 1
          FROM unnest(contractor.services) AS offered_service
          WHERE lower(offered_service) = lower(p_job.service_type)
        )
        OR EXISTS (
          SELECT 1
          FROM public.service_categories AS category
          CROSS JOIN LATERAL unnest(contractor.services) AS offered_service
          WHERE category.id = p_job.service_category_id
            AND lower(offered_service) = lower(category.name)
        )
        OR EXISTS (
          SELECT 1
          FROM public.service_types AS service_type
          JOIN public.service_categories AS category
            ON category.id = service_type.category_id
          CROSS JOIN LATERAL unnest(contractor.services) AS offered_service
          WHERE service_type.id = p_job.service_type_id
            AND (
              lower(offered_service) = lower(service_type.name)
              OR lower(offered_service) = lower(category.name)
            )
        )
      )
      AND public.distance_km(
        contractor.current_latitude,
        contractor.current_longitude,
        p_job.latitude,
        p_job.longitude
      ) <= least(greatest(p_radius_km, 0), 15)
  );
$function$
;

CREATE OR REPLACE FUNCTION public.accept_job(p_job_id uuid, p_contractor_id uuid)
 RETURNS public.jobs
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_job public.jobs;
BEGIN
  IF p_contractor_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Contractor identity does not match authenticated user';
  END IF;

  SELECT *
  INTO v_job
  FROM public.jobs
  WHERE id = p_job_id
  FOR UPDATE;

  IF v_job IS NULL THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  IF v_job.status != 'broadcast' THEN
    RAISE EXCEPTION 'Job is no longer available';
  END IF;

  IF NOT public.is_contractor_eligible_for_job(v_job, 15) THEN
    RAISE EXCEPTION 'Job is outside your service area or does not match your availability';
  END IF;

  UPDATE public.jobs
  SET contractor_id = p_contractor_id,
      status = 'accepted',
      accepted_at = now()
  WHERE id = p_job_id
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_nearby_broadcast_jobs(p_radius_km double precision DEFAULT 15)
 RETURNS SETOF public.jobs
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  SELECT job.*
  FROM public.jobs AS job
  WHERE job.status = 'broadcast'
    AND public.is_contractor_eligible_for_job(
      job,
      least(greatest(p_radius_km, 0), 15)
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.job_declined_contractors AS declined
      WHERE declined.job_id = job.id
        AND declined.contractor_id = auth.uid()
    )
  ORDER BY job.created_at DESC;
$function$
;

CREATE OR REPLACE FUNCTION public.get_nearby_contractors(p_service_type text, p_latitude double precision, p_longitude double precision, p_radius_km double precision DEFAULT 15)
 RETURNS SETOF public.contractors
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  SELECT contractor.*
  FROM public.contractors AS contractor
  WHERE contractor.availability_status = 'online'
    AND contractor.is_verified = true
    AND contractor.current_latitude IS NOT NULL
    AND contractor.current_longitude IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM unnest(contractor.services) AS offered_service
      WHERE lower(offered_service) = lower(p_service_type)
    )
    AND public.distance_km(
      p_latitude,
      p_longitude,
      contractor.current_latitude,
      contractor.current_longitude
    ) <= least(greatest(p_radius_km, 0), 15)
  ORDER BY public.distance_km(
    p_latitude,
    p_longitude,
    contractor.current_latitude,
    contractor.current_longitude
  );
$function$
;

grant delete on table "public"."support_ticket_messages" to "anon";

grant insert on table "public"."support_ticket_messages" to "anon";

grant references on table "public"."support_ticket_messages" to "anon";

grant select on table "public"."support_ticket_messages" to "anon";

grant trigger on table "public"."support_ticket_messages" to "anon";

grant truncate on table "public"."support_ticket_messages" to "anon";

grant update on table "public"."support_ticket_messages" to "anon";

grant delete on table "public"."support_ticket_messages" to "authenticated";

grant insert on table "public"."support_ticket_messages" to "authenticated";

grant references on table "public"."support_ticket_messages" to "authenticated";

grant select on table "public"."support_ticket_messages" to "authenticated";

grant trigger on table "public"."support_ticket_messages" to "authenticated";

grant truncate on table "public"."support_ticket_messages" to "authenticated";

grant update on table "public"."support_ticket_messages" to "authenticated";

grant delete on table "public"."support_ticket_messages" to "service_role";

grant insert on table "public"."support_ticket_messages" to "service_role";

grant references on table "public"."support_ticket_messages" to "service_role";

grant select on table "public"."support_ticket_messages" to "service_role";

grant trigger on table "public"."support_ticket_messages" to "service_role";

grant truncate on table "public"."support_ticket_messages" to "service_role";

grant update on table "public"."support_ticket_messages" to "service_role";


  create policy "dispute_evidence_insert_admins_only"
  on "public"."dispute_evidence"
  as permissive
  for insert
  to public
with check (public.is_admin_user());



  create policy "dispute_evidence_select_admins_only"
  on "public"."dispute_evidence"
  as permissive
  for select
  to public
using (public.is_admin_user());



  create policy "support_ticket_messages_insert_admins"
  on "public"."support_ticket_messages"
  as permissive
  for insert
  to public
with check ((public.is_admin_user() AND (sender_role = 'admin'::text)));



  create policy "support_ticket_messages_insert_requesters"
  on "public"."support_ticket_messages"
  as permissive
  for insert
  to public
with check (((sender_id = auth.uid()) AND (sender_role = ANY (ARRAY['user'::text, 'contractor'::text])) AND (ticket_id IN ( SELECT support_tickets.id
   FROM public.support_tickets
  WHERE (support_tickets.requester_id = auth.uid())))));



  create policy "support_ticket_messages_select_admins"
  on "public"."support_ticket_messages"
  as permissive
  for select
  to public
using (public.is_admin_user());



  create policy "support_ticket_messages_select_requesters"
  on "public"."support_ticket_messages"
  as permissive
  for select
  to public
using ((ticket_id IN ( SELECT support_tickets.id
   FROM public.support_tickets
  WHERE (support_tickets.requester_id = auth.uid()))));



  create policy "support_ticket_messages_update_admins_read"
  on "public"."support_ticket_messages"
  as permissive
  for update
  to public
using (public.is_admin_user())
with check (public.is_admin_user());



  create policy "Admins can delete own MFA recovery codes"
  on "public"."admin_mfa_recovery_codes"
  as permissive
  for delete
  to authenticated
using ((public.is_admin_user() AND (auth.uid() = admin_user_id)));



  create policy "Admins can insert own MFA recovery codes"
  on "public"."admin_mfa_recovery_codes"
  as permissive
  for insert
  to authenticated
with check ((public.is_admin_user() AND (auth.uid() = admin_user_id)));



  create policy "Admins can update own MFA recovery codes"
  on "public"."admin_mfa_recovery_codes"
  as permissive
  for update
  to authenticated
using ((public.is_admin_user() AND (auth.uid() = admin_user_id)))
with check ((public.is_admin_user() AND (auth.uid() = admin_user_id)));



  create policy "Admins can view own MFA recovery codes"
  on "public"."admin_mfa_recovery_codes"
  as permissive
  for select
  to authenticated
using ((public.is_admin_user() AND (auth.uid() = admin_user_id)));



  create policy "Admins can insert own security events"
  on "public"."admin_security_events"
  as permissive
  for insert
  to authenticated
with check ((public.is_admin_user() AND (auth.uid() = actor_id) AND (auth.uid() = admin_user_id)));



  create policy "Admins can view own security events"
  on "public"."admin_security_events"
  as permissive
  for select
  to authenticated
using ((public.is_admin_user() AND ((auth.uid() = admin_user_id) OR (auth.uid() = actor_id))));



  create policy "Admins can insert own security settings"
  on "public"."admin_security_settings"
  as permissive
  for insert
  to authenticated
with check ((public.is_admin_user() AND (auth.uid() = admin_user_id)));



  create policy "Admins can update own security settings"
  on "public"."admin_security_settings"
  as permissive
  for update
  to authenticated
using ((public.is_admin_user() AND (auth.uid() = admin_user_id)))
with check ((public.is_admin_user() AND (auth.uid() = admin_user_id)));



  create policy "Admins can view own security settings"
  on "public"."admin_security_settings"
  as permissive
  for select
  to authenticated
using ((public.is_admin_user() AND (auth.uid() = admin_user_id)));



  create policy "Chat participants can send messages"
  on "public"."chat_messages"
  as permissive
  for insert
  to authenticated
with check (((auth.uid() = sender_id) AND (conversation_id IN ( SELECT chat_conversations.id
   FROM public.chat_conversations
  WHERE ((chat_conversations.user_id = auth.uid()) OR (chat_conversations.contractor_id = auth.uid()))))));



  create policy "Chat participants can view messages"
  on "public"."chat_messages"
  as permissive
  for select
  to authenticated
using ((conversation_id IN ( SELECT chat_conversations.id
   FROM public.chat_conversations
  WHERE ((chat_conversations.user_id = auth.uid()) OR (chat_conversations.contractor_id = auth.uid())))));



  create policy "Recipients can mark messages read"
  on "public"."chat_messages"
  as permissive
  for update
  to authenticated
using (((sender_id <> auth.uid()) AND (conversation_id IN ( SELECT chat_conversations.id
   FROM public.chat_conversations
  WHERE ((chat_conversations.user_id = auth.uid()) OR (chat_conversations.contractor_id = auth.uid()))))));



  create policy "Admins can view contractor bank accounts"
  on "public"."contractor_bank_accounts"
  as permissive
  for select
  to authenticated
using (public.is_admin_user());



  create policy "Admins can review contractor documents"
  on "public"."contractor_documents"
  as permissive
  for update
  to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());



  create policy "Admins can view contractor documents"
  on "public"."contractor_documents"
  as permissive
  for select
  to authenticated
using (public.is_admin_user());



  create policy "Admins can update contractors"
  on "public"."contractors"
  as permissive
  for update
  to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());



  create policy "Admins can insert dispute events"
  on "public"."dispute_events"
  as permissive
  for insert
  to authenticated
with check (public.is_admin_user());



  create policy "Admins can update dispute events"
  on "public"."dispute_events"
  as permissive
  for update
  to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());



  create policy "Admins can view dispute events"
  on "public"."dispute_events"
  as permissive
  for select
  to authenticated
using (public.is_admin_user());



  create policy "Admins can insert dispute evidence"
  on "public"."dispute_evidence"
  as permissive
  for insert
  to authenticated
with check (public.is_admin_user());



  create policy "Admins can update dispute evidence"
  on "public"."dispute_evidence"
  as permissive
  for update
  to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());



  create policy "Admins can view dispute evidence"
  on "public"."dispute_evidence"
  as permissive
  for select
  to authenticated
using (public.is_admin_user());



  create policy "Admins can insert disputes"
  on "public"."disputes"
  as permissive
  for insert
  to authenticated
with check (public.is_admin_user());



  create policy "Admins can update disputes"
  on "public"."disputes"
  as permissive
  for update
  to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());



  create policy "Admins can view disputes"
  on "public"."disputes"
  as permissive
  for select
  to authenticated
using (public.is_admin_user());



  create policy "Admins can insert finance admin events"
  on "public"."finance_admin_events"
  as permissive
  for insert
  to public
with check (public.is_admin_user());



  create policy "Admins can view finance admin events"
  on "public"."finance_admin_events"
  as permissive
  for select
  to public
using (public.is_admin_user());



  create policy "Job participants can view attachments"
  on "public"."job_attachments"
  as permissive
  for select
  to authenticated
using ((job_id IN ( SELECT jobs.id
   FROM public.jobs
  WHERE ((jobs.user_id = auth.uid()) OR (jobs.contractor_id = auth.uid())))));



  create policy "Declined visible to job owner and contractor"
  on "public"."job_declined_contractors"
  as permissive
  for select
  to authenticated
using (((contractor_id = auth.uid()) OR (job_id IN ( SELECT jobs.id
   FROM public.jobs
  WHERE (jobs.user_id = auth.uid())))));



  create policy "Admins can update jobs"
  on "public"."jobs"
  as permissive
  for update
  to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());



  create policy "Admins can view jobs"
  on "public"."jobs"
  as permissive
  for select
  to authenticated
using (public.is_admin_user());



  create policy "Contractors can view available and assigned jobs"
  on "public"."jobs"
  as permissive
  for select
  to authenticated
using (((auth.uid() = contractor_id) OR ((status = 'broadcast'::text) AND public.is_contractor_eligible_for_job(jobs.*, (15)::double precision))));



  create policy "Admins can delete notification campaigns"
  on "public"."notification_campaigns"
  as permissive
  for delete
  to authenticated
using (public.is_admin_user());



  create policy "Admins can insert notification campaigns"
  on "public"."notification_campaigns"
  as permissive
  for insert
  to authenticated
with check (public.is_admin_user());



  create policy "Admins can update notification campaigns"
  on "public"."notification_campaigns"
  as permissive
  for update
  to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());



  create policy "Admins can view notification campaigns"
  on "public"."notification_campaigns"
  as permissive
  for select
  to authenticated
using (public.is_admin_user());



  create policy "Admins can insert notification deliveries"
  on "public"."notification_deliveries"
  as permissive
  for insert
  to authenticated
with check (public.is_admin_user());



  create policy "Admins can update notification deliveries"
  on "public"."notification_deliveries"
  as permissive
  for update
  to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());



  create policy "Admins can view notification deliveries"
  on "public"."notification_deliveries"
  as permissive
  for select
  to authenticated
using (public.is_admin_user());



  create policy "Admins can delete notification templates"
  on "public"."notification_templates"
  as permissive
  for delete
  to authenticated
using (public.is_admin_user());



  create policy "Admins can insert notification templates"
  on "public"."notification_templates"
  as permissive
  for insert
  to authenticated
with check (public.is_admin_user());



  create policy "Admins can update notification templates"
  on "public"."notification_templates"
  as permissive
  for update
  to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());



  create policy "Admins can view notification templates"
  on "public"."notification_templates"
  as permissive
  for select
  to authenticated
using (public.is_admin_user());



  create policy "Admins can view notifications"
  on "public"."notifications"
  as permissive
  for select
  to authenticated
using (public.is_admin_user());



  create policy "Admins can view payments"
  on "public"."payments"
  as permissive
  for select
  to authenticated
using (public.is_admin_user());



  create policy "Admins can insert platform config"
  on "public"."platform_config"
  as permissive
  for insert
  to authenticated
with check (public.is_admin_user());



  create policy "Admins can update platform config"
  on "public"."platform_config"
  as permissive
  for update
  to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());



  create policy "Admins can insert promo code redemptions"
  on "public"."promo_code_redemptions"
  as permissive
  for insert
  to authenticated
with check (public.is_admin_user());



  create policy "Admins can update promo code redemptions"
  on "public"."promo_code_redemptions"
  as permissive
  for update
  to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());



  create policy "Admins can view promo code redemptions"
  on "public"."promo_code_redemptions"
  as permissive
  for select
  to authenticated
using (public.is_admin_user());



  create policy "Admins can delete promo codes"
  on "public"."promo_codes"
  as permissive
  for delete
  to authenticated
using (public.is_admin_user());



  create policy "Admins can insert promo codes"
  on "public"."promo_codes"
  as permissive
  for insert
  to authenticated
with check (public.is_admin_user());



  create policy "Admins can update promo codes"
  on "public"."promo_codes"
  as permissive
  for update
  to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());



  create policy "Admins can view promo codes"
  on "public"."promo_codes"
  as permissive
  for select
  to authenticated
using (public.is_admin_user());



  create policy "Users can create reviews for their jobs"
  on "public"."reviews"
  as permissive
  for insert
  to authenticated
with check (((auth.uid() = reviewer_id) AND (job_id IN ( SELECT jobs.id
   FROM public.jobs
  WHERE ((jobs.user_id = auth.uid()) OR (jobs.contractor_id = auth.uid()))))));



  create policy "Admins can insert service categories"
  on "public"."service_categories"
  as permissive
  for insert
  to authenticated
with check (public.is_admin_user());



  create policy "Admins can update service categories"
  on "public"."service_categories"
  as permissive
  for update
  to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());



  create policy "Admins can insert service types"
  on "public"."service_types"
  as permissive
  for insert
  to authenticated
with check (public.is_admin_user());



  create policy "Admins can update service types"
  on "public"."service_types"
  as permissive
  for update
  to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());



  create policy "Admins can insert support ticket events"
  on "public"."support_ticket_events"
  as permissive
  for insert
  to authenticated
with check (public.is_admin_user());



  create policy "Admins can update support ticket events"
  on "public"."support_ticket_events"
  as permissive
  for update
  to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());



  create policy "Admins can view support ticket events"
  on "public"."support_ticket_events"
  as permissive
  for select
  to authenticated
using (public.is_admin_user());



  create policy "Admins can insert support tickets"
  on "public"."support_tickets"
  as permissive
  for insert
  to authenticated
with check (public.is_admin_user());



  create policy "Admins can update support tickets"
  on "public"."support_tickets"
  as permissive
  for update
  to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());



  create policy "Admins can view support tickets"
  on "public"."support_tickets"
  as permissive
  for select
  to authenticated
using (public.is_admin_user());



  create policy "Admins can insert urgency tiers"
  on "public"."urgency_tiers"
  as permissive
  for insert
  to authenticated
with check (public.is_admin_user());



  create policy "Admins can update urgency tiers"
  on "public"."urgency_tiers"
  as permissive
  for update
  to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());



  create policy "Admins can view withdrawals"
  on "public"."withdrawals"
  as permissive
  for select
  to authenticated
using (public.is_admin_user());


CREATE TRIGGER set_admin_security_settings_updated_at BEFORE UPDATE ON public.admin_security_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_chat_conversations_updated_at BEFORE UPDATE ON public.chat_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER on_contractor_verification_update BEFORE UPDATE ON public.contractors FOR EACH ROW EXECUTE FUNCTION public.check_contractor_verification();

CREATE TRIGGER set_contractors_updated_at BEFORE UPDATE ON public.contractors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER on_job_broadcast_notify_contractors AFTER INSERT OR UPDATE OF status ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.notify_nearby_contractors();

CREATE TRIGGER on_job_completed_close_chat AFTER UPDATE OF status ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.close_conversation_on_job_complete();

CREATE TRIGGER on_job_status_changed AFTER UPDATE OF status ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_contractor_acceptance_rate();

CREATE TRIGGER set_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_notification_campaigns_updated_at BEFORE UPDATE ON public.notification_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_notification_templates_updated_at BEFORE UPDATE ON public.notification_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER on_profile_role_sync_contractor AFTER INSERT OR UPDATE OF role ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.sync_contractor_role_row();

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_promo_codes_updated_at BEFORE UPDATE ON public.promo_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER on_review_created AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_contractor_rating();

drop trigger if exists "on_auth_user_created" on "auth"."users";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

drop policy "Chat attachment read" on "storage"."objects";

drop policy "Chat attachment upload" on "storage"."objects";

drop policy "Job attachment read" on "storage"."objects";


  create policy "Chat attachment read"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'chat-attachments'::text) AND ((storage.foldername(name))[1] IN ( SELECT (chat_conversations.id)::text AS id
   FROM public.chat_conversations
  WHERE ((chat_conversations.user_id = auth.uid()) OR (chat_conversations.contractor_id = auth.uid()))))));



  create policy "Chat attachment upload"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'chat-attachments'::text) AND ((storage.foldername(name))[1] IN ( SELECT (chat_conversations.id)::text AS id
   FROM public.chat_conversations
  WHERE ((chat_conversations.user_id = auth.uid()) OR (chat_conversations.contractor_id = auth.uid()))))));



  create policy "Job attachment read"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'job-attachments'::text) AND ((storage.foldername(name))[1] IN ( SELECT (jobs.id)::text AS id
   FROM public.jobs
  WHERE ((jobs.user_id = auth.uid()) OR (jobs.contractor_id = auth.uid()))))));



