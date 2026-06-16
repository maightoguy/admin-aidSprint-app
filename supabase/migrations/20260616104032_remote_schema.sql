drop trigger if exists "set_chat_conversations_updated_at" on "public"."chat_conversations";

drop trigger if exists "on_contractor_verification_update" on "public"."contractors";

drop trigger if exists "set_contractors_updated_at" on "public"."contractors";

drop trigger if exists "on_job_broadcast_notify_contractors" on "public"."jobs";

drop trigger if exists "on_job_completed_close_chat" on "public"."jobs";

drop trigger if exists "on_job_status_changed" on "public"."jobs";

drop trigger if exists "set_jobs_updated_at" on "public"."jobs";

drop trigger if exists "set_payments_updated_at" on "public"."payments";

drop trigger if exists "on_profile_role_sync_contractor" on "public"."profiles";

drop trigger if exists "set_profiles_updated_at" on "public"."profiles";

drop trigger if exists "on_review_created" on "public"."reviews";

drop policy "Chat participants can send messages" on "public"."chat_messages";

drop policy "Chat participants can view messages" on "public"."chat_messages";

drop policy "Recipients can mark messages read" on "public"."chat_messages";

drop policy "Admins can view contractor bank accounts" on "public"."contractor_bank_accounts";

drop policy "Admins can review contractor documents" on "public"."contractor_documents";

drop policy "Admins can view contractor documents" on "public"."contractor_documents";

drop policy "Admins can update contractors" on "public"."contractors";

drop policy "Admins can insert finance admin events" on "public"."finance_admin_events";

drop policy "Admins can view finance admin events" on "public"."finance_admin_events";

drop policy "Job participants can view attachments" on "public"."job_attachments";

drop policy "Declined visible to job owner and contractor" on "public"."job_declined_contractors";

drop policy "Admins can update jobs" on "public"."jobs";

drop policy "Admins can view jobs" on "public"."jobs";

drop policy "Contractors can view available and assigned jobs" on "public"."jobs";

drop policy "Admins can view notifications" on "public"."notifications";

drop policy "Admins can view payments" on "public"."payments";

drop policy "Admins can insert platform config" on "public"."platform_config";

drop policy "Admins can update platform config" on "public"."platform_config";

drop policy "Users can create reviews for their jobs" on "public"."reviews";

drop policy "Admins can insert service categories" on "public"."service_categories";

drop policy "Admins can update service categories" on "public"."service_categories";

drop policy "Admins can insert service types" on "public"."service_types";

drop policy "Admins can update service types" on "public"."service_types";

drop policy "Admins can insert urgency tiers" on "public"."urgency_tiers";

drop policy "Admins can update urgency tiers" on "public"."urgency_tiers";

drop policy "Admins can view withdrawals" on "public"."withdrawals";

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

alter table "public"."notifications" drop constraint "notifications_recipient_id_fkey";

alter table "public"."payments" drop constraint "payments_job_id_fkey";

alter table "public"."payments" drop constraint "payments_payee_id_fkey";

alter table "public"."payments" drop constraint "payments_payer_id_fkey";

alter table "public"."reviews" drop constraint "reviews_job_id_fkey";

alter table "public"."reviews" drop constraint "reviews_reviewee_id_fkey";

alter table "public"."reviews" drop constraint "reviews_reviewer_id_fkey";

alter table "public"."service_types" drop constraint "service_types_category_id_fkey";

alter table "public"."withdrawals" drop constraint "withdrawals_bank_account_id_fkey";

alter table "public"."withdrawals" drop constraint "withdrawals_contractor_id_fkey";

drop function if exists "public"."is_contractor_eligible_for_job"(p_job jobs, p_radius_km double precision);


  create table "public"."dispute_events" (
    "id" uuid not null default gen_random_uuid(),
    "dispute_id" uuid not null,
    "actor_id" uuid not null,
    "actor_role" text not null,
    "action" text not null,
    "reason" text not null default ''::text,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."dispute_events" enable row level security;


  create table "public"."dispute_evidence" (
    "id" uuid not null default gen_random_uuid(),
    "dispute_id" uuid not null,
    "submitted_by_id" uuid not null,
    "submitted_by_role" text not null,
    "evidence_type" text not null,
    "url" text,
    "description" text not null default ''::text,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."dispute_evidence" enable row level security;


  create table "public"."disputes" (
    "id" uuid not null default gen_random_uuid(),
    "job_id" uuid not null,
    "opened_by_id" uuid not null,
    "opened_by_role" text not null,
    "dispute_type" text not null,
    "status" text not null,
    "priority" text not null,
    "reason" text not null default ''::text,
    "requested_resolution" text not null default ''::text,
    "assigned_admin_id" uuid,
    "related_payment_id" uuid,
    "related_withdrawal_id" uuid,
    "resolution_type" text,
    "resolution_amount" numeric,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "resolved_at" timestamp with time zone,
    "rejected_at" timestamp with time zone
      );


alter table "public"."disputes" enable row level security;


  create table "public"."support_ticket_events" (
    "id" uuid not null default gen_random_uuid(),
    "ticket_id" uuid not null,
    "actor_id" uuid not null,
    "actor_role" text not null,
    "event_type" text not null,
    "message" text not null default ''::text,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."support_ticket_events" enable row level security;


  create table "public"."support_tickets" (
    "id" uuid not null default gen_random_uuid(),
    "requester_id" uuid not null,
    "requester_role" text not null,
    "job_id" uuid,
    "subject" text not null,
    "description" text not null,
    "status" text not null,
    "priority" text not null,
    "assigned_admin_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "resolved_at" timestamp with time zone,
    "closed_at" timestamp with time zone
      );


alter table "public"."support_tickets" enable row level security;

CREATE INDEX dispute_events_created_at_idx ON public.dispute_events USING btree (created_at DESC);

CREATE INDEX dispute_events_dispute_id_idx ON public.dispute_events USING btree (dispute_id, created_at DESC);

CREATE UNIQUE INDEX dispute_events_pkey ON public.dispute_events USING btree (id);

CREATE INDEX dispute_evidence_dispute_id_idx ON public.dispute_evidence USING btree (dispute_id, created_at DESC);

CREATE UNIQUE INDEX dispute_evidence_pkey ON public.dispute_evidence USING btree (id);

CREATE INDEX disputes_assigned_admin_id_idx ON public.disputes USING btree (assigned_admin_id);

CREATE INDEX disputes_created_at_idx ON public.disputes USING btree (created_at DESC);

CREATE INDEX disputes_job_id_idx ON public.disputes USING btree (job_id);

CREATE UNIQUE INDEX disputes_pkey ON public.disputes USING btree (id);

CREATE INDEX disputes_status_idx ON public.disputes USING btree (status);

CREATE INDEX support_ticket_events_created_at_idx ON public.support_ticket_events USING btree (created_at DESC);

CREATE UNIQUE INDEX support_ticket_events_pkey ON public.support_ticket_events USING btree (id);

CREATE INDEX support_ticket_events_ticket_id_idx ON public.support_ticket_events USING btree (ticket_id, created_at DESC);

CREATE INDEX support_tickets_created_at_idx ON public.support_tickets USING btree (created_at DESC);

CREATE INDEX support_tickets_job_id_idx ON public.support_tickets USING btree (job_id);

CREATE UNIQUE INDEX support_tickets_pkey ON public.support_tickets USING btree (id);

CREATE INDEX support_tickets_requester_id_idx ON public.support_tickets USING btree (requester_id);

CREATE INDEX support_tickets_status_idx ON public.support_tickets USING btree (status);

alter table "public"."dispute_events" add constraint "dispute_events_pkey" PRIMARY KEY using index "dispute_events_pkey";

alter table "public"."dispute_evidence" add constraint "dispute_evidence_pkey" PRIMARY KEY using index "dispute_evidence_pkey";

alter table "public"."disputes" add constraint "disputes_pkey" PRIMARY KEY using index "disputes_pkey";

alter table "public"."support_ticket_events" add constraint "support_ticket_events_pkey" PRIMARY KEY using index "support_ticket_events_pkey";

alter table "public"."support_tickets" add constraint "support_tickets_pkey" PRIMARY KEY using index "support_tickets_pkey";

alter table "public"."dispute_events" add constraint "dispute_events_action_check" CHECK ((action = ANY (ARRAY['created'::text, 'request_evidence'::text, 'add_evidence'::text, 'propose_resolution'::text, 'resolve'::text, 'reject'::text, 'escalate'::text, 'note'::text]))) not valid;

alter table "public"."dispute_events" validate constraint "dispute_events_action_check";

alter table "public"."dispute_events" add constraint "dispute_events_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.profiles(id) not valid;

alter table "public"."dispute_events" validate constraint "dispute_events_actor_id_fkey";

alter table "public"."dispute_events" add constraint "dispute_events_actor_role_check" CHECK ((actor_role = ANY (ARRAY['user'::text, 'contractor'::text, 'admin'::text, 'system'::text]))) not valid;

alter table "public"."dispute_events" validate constraint "dispute_events_actor_role_check";

alter table "public"."dispute_events" add constraint "dispute_events_dispute_id_fkey" FOREIGN KEY (dispute_id) REFERENCES public.disputes(id) ON DELETE CASCADE not valid;

alter table "public"."dispute_events" validate constraint "dispute_events_dispute_id_fkey";

alter table "public"."dispute_evidence" add constraint "dispute_evidence_dispute_id_fkey" FOREIGN KEY (dispute_id) REFERENCES public.disputes(id) ON DELETE CASCADE not valid;

alter table "public"."dispute_evidence" validate constraint "dispute_evidence_dispute_id_fkey";

alter table "public"."dispute_evidence" add constraint "dispute_evidence_submitted_by_id_fkey" FOREIGN KEY (submitted_by_id) REFERENCES public.profiles(id) not valid;

alter table "public"."dispute_evidence" validate constraint "dispute_evidence_submitted_by_id_fkey";

alter table "public"."dispute_evidence" add constraint "dispute_evidence_submitted_by_role_check" CHECK ((submitted_by_role = ANY (ARRAY['user'::text, 'contractor'::text, 'admin'::text]))) not valid;

alter table "public"."dispute_evidence" validate constraint "dispute_evidence_submitted_by_role_check";

alter table "public"."dispute_evidence" add constraint "dispute_evidence_type_check" CHECK ((evidence_type = ANY (ARRAY['text'::text, 'image'::text, 'file'::text, 'link'::text]))) not valid;

alter table "public"."dispute_evidence" validate constraint "dispute_evidence_type_check";

alter table "public"."disputes" add constraint "disputes_assigned_admin_id_fkey" FOREIGN KEY (assigned_admin_id) REFERENCES public.profiles(id) not valid;

alter table "public"."disputes" validate constraint "disputes_assigned_admin_id_fkey";

alter table "public"."disputes" add constraint "disputes_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE not valid;

alter table "public"."disputes" validate constraint "disputes_job_id_fkey";

alter table "public"."disputes" add constraint "disputes_opened_by_id_fkey" FOREIGN KEY (opened_by_id) REFERENCES public.profiles(id) not valid;

alter table "public"."disputes" validate constraint "disputes_opened_by_id_fkey";

alter table "public"."disputes" add constraint "disputes_opened_by_role_check" CHECK ((opened_by_role = ANY (ARRAY['user'::text, 'contractor'::text, 'admin'::text]))) not valid;

alter table "public"."disputes" validate constraint "disputes_opened_by_role_check";

alter table "public"."disputes" add constraint "disputes_priority_check" CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))) not valid;

alter table "public"."disputes" validate constraint "disputes_priority_check";

alter table "public"."disputes" add constraint "disputes_related_payment_id_fkey" FOREIGN KEY (related_payment_id) REFERENCES public.payments(id) ON DELETE SET NULL not valid;

alter table "public"."disputes" validate constraint "disputes_related_payment_id_fkey";

alter table "public"."disputes" add constraint "disputes_related_withdrawal_id_fkey" FOREIGN KEY (related_withdrawal_id) REFERENCES public.withdrawals(id) ON DELETE SET NULL not valid;

alter table "public"."disputes" validate constraint "disputes_related_withdrawal_id_fkey";

alter table "public"."disputes" add constraint "disputes_resolution_type_check" CHECK (((resolution_type IS NULL) OR (resolution_type = ANY (ARRAY['no_action'::text, 'refund'::text, 'partial_refund'::text, 'payout_release'::text, 'payout_block'::text, 'chargeback'::text])))) not valid;

alter table "public"."disputes" validate constraint "disputes_resolution_type_check";

alter table "public"."disputes" add constraint "disputes_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'under_review'::text, 'awaiting_evidence'::text, 'proposed_resolution'::text, 'resolved'::text, 'rejected'::text, 'escalated'::text]))) not valid;

alter table "public"."disputes" validate constraint "disputes_status_check";

alter table "public"."disputes" add constraint "disputes_type_check" CHECK ((dispute_type = ANY (ARRAY['service_quality'::text, 'payment'::text, 'behavior'::text, 'safety'::text, 'other'::text]))) not valid;

alter table "public"."disputes" validate constraint "disputes_type_check";

alter table "public"."support_ticket_events" add constraint "support_ticket_events_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.profiles(id) not valid;

alter table "public"."support_ticket_events" validate constraint "support_ticket_events_actor_id_fkey";

alter table "public"."support_ticket_events" add constraint "support_ticket_events_actor_role_check" CHECK ((actor_role = ANY (ARRAY['user'::text, 'contractor'::text, 'admin'::text, 'system'::text]))) not valid;

alter table "public"."support_ticket_events" validate constraint "support_ticket_events_actor_role_check";

alter table "public"."support_ticket_events" add constraint "support_ticket_events_event_type_check" CHECK ((event_type = ANY (ARRAY['created'::text, 'assigned'::text, 'status_changed'::text, 'message'::text, 'note'::text, 'resolved'::text, 'closed'::text]))) not valid;

alter table "public"."support_ticket_events" validate constraint "support_ticket_events_event_type_check";

alter table "public"."support_ticket_events" add constraint "support_ticket_events_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE not valid;

alter table "public"."support_ticket_events" validate constraint "support_ticket_events_ticket_id_fkey";

alter table "public"."support_tickets" add constraint "support_tickets_assigned_admin_id_fkey" FOREIGN KEY (assigned_admin_id) REFERENCES public.profiles(id) not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_assigned_admin_id_fkey";

alter table "public"."support_tickets" add constraint "support_tickets_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_job_id_fkey";

alter table "public"."support_tickets" add constraint "support_tickets_priority_check" CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))) not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_priority_check";

alter table "public"."support_tickets" add constraint "support_tickets_requester_id_fkey" FOREIGN KEY (requester_id) REFERENCES public.profiles(id) not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_requester_id_fkey";

alter table "public"."support_tickets" add constraint "support_tickets_requester_role_check" CHECK ((requester_role = ANY (ARRAY['user'::text, 'contractor'::text, 'admin'::text]))) not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_requester_role_check";

alter table "public"."support_tickets" add constraint "support_tickets_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'in_review'::text, 'awaiting_requester'::text, 'awaiting_contractor'::text, 'resolved'::text, 'closed'::text]))) not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_status_check";

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

alter table "public"."notifications" add constraint "notifications_recipient_id_fkey" FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) not valid;

alter table "public"."notifications" validate constraint "notifications_recipient_id_fkey";

alter table "public"."payments" add constraint "payments_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) not valid;

alter table "public"."payments" validate constraint "payments_job_id_fkey";

alter table "public"."payments" add constraint "payments_payee_id_fkey" FOREIGN KEY (payee_id) REFERENCES public.profiles(id) not valid;

alter table "public"."payments" validate constraint "payments_payee_id_fkey";

alter table "public"."payments" add constraint "payments_payer_id_fkey" FOREIGN KEY (payer_id) REFERENCES public.profiles(id) not valid;

alter table "public"."payments" validate constraint "payments_payer_id_fkey";

alter table "public"."reviews" add constraint "reviews_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) not valid;

alter table "public"."reviews" validate constraint "reviews_job_id_fkey";

alter table "public"."reviews" add constraint "reviews_reviewee_id_fkey" FOREIGN KEY (reviewee_id) REFERENCES public.profiles(id) not valid;

alter table "public"."reviews" validate constraint "reviews_reviewee_id_fkey";

alter table "public"."reviews" add constraint "reviews_reviewer_id_fkey" FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id) not valid;

alter table "public"."reviews" validate constraint "reviews_reviewer_id_fkey";

alter table "public"."service_types" add constraint "service_types_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.service_categories(id) ON DELETE CASCADE not valid;

alter table "public"."service_types" validate constraint "service_types_category_id_fkey";

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
      AND EXISTS (
        SELECT 1
        FROM unnest(contractor.services) AS offered_service
        WHERE lower(offered_service) = lower(p_job.service_type)
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

grant delete on table "public"."dispute_events" to "anon";

grant insert on table "public"."dispute_events" to "anon";

grant references on table "public"."dispute_events" to "anon";

grant select on table "public"."dispute_events" to "anon";

grant trigger on table "public"."dispute_events" to "anon";

grant truncate on table "public"."dispute_events" to "anon";

grant update on table "public"."dispute_events" to "anon";

grant delete on table "public"."dispute_events" to "authenticated";

grant insert on table "public"."dispute_events" to "authenticated";

grant references on table "public"."dispute_events" to "authenticated";

grant select on table "public"."dispute_events" to "authenticated";

grant trigger on table "public"."dispute_events" to "authenticated";

grant truncate on table "public"."dispute_events" to "authenticated";

grant update on table "public"."dispute_events" to "authenticated";

grant delete on table "public"."dispute_events" to "service_role";

grant insert on table "public"."dispute_events" to "service_role";

grant references on table "public"."dispute_events" to "service_role";

grant select on table "public"."dispute_events" to "service_role";

grant trigger on table "public"."dispute_events" to "service_role";

grant truncate on table "public"."dispute_events" to "service_role";

grant update on table "public"."dispute_events" to "service_role";

grant delete on table "public"."dispute_evidence" to "anon";

grant insert on table "public"."dispute_evidence" to "anon";

grant references on table "public"."dispute_evidence" to "anon";

grant select on table "public"."dispute_evidence" to "anon";

grant trigger on table "public"."dispute_evidence" to "anon";

grant truncate on table "public"."dispute_evidence" to "anon";

grant update on table "public"."dispute_evidence" to "anon";

grant delete on table "public"."dispute_evidence" to "authenticated";

grant insert on table "public"."dispute_evidence" to "authenticated";

grant references on table "public"."dispute_evidence" to "authenticated";

grant select on table "public"."dispute_evidence" to "authenticated";

grant trigger on table "public"."dispute_evidence" to "authenticated";

grant truncate on table "public"."dispute_evidence" to "authenticated";

grant update on table "public"."dispute_evidence" to "authenticated";

grant delete on table "public"."dispute_evidence" to "service_role";

grant insert on table "public"."dispute_evidence" to "service_role";

grant references on table "public"."dispute_evidence" to "service_role";

grant select on table "public"."dispute_evidence" to "service_role";

grant trigger on table "public"."dispute_evidence" to "service_role";

grant truncate on table "public"."dispute_evidence" to "service_role";

grant update on table "public"."dispute_evidence" to "service_role";

grant delete on table "public"."disputes" to "anon";

grant insert on table "public"."disputes" to "anon";

grant references on table "public"."disputes" to "anon";

grant select on table "public"."disputes" to "anon";

grant trigger on table "public"."disputes" to "anon";

grant truncate on table "public"."disputes" to "anon";

grant update on table "public"."disputes" to "anon";

grant delete on table "public"."disputes" to "authenticated";

grant insert on table "public"."disputes" to "authenticated";

grant references on table "public"."disputes" to "authenticated";

grant select on table "public"."disputes" to "authenticated";

grant trigger on table "public"."disputes" to "authenticated";

grant truncate on table "public"."disputes" to "authenticated";

grant update on table "public"."disputes" to "authenticated";

grant delete on table "public"."disputes" to "service_role";

grant insert on table "public"."disputes" to "service_role";

grant references on table "public"."disputes" to "service_role";

grant select on table "public"."disputes" to "service_role";

grant trigger on table "public"."disputes" to "service_role";

grant truncate on table "public"."disputes" to "service_role";

grant update on table "public"."disputes" to "service_role";

grant delete on table "public"."support_ticket_events" to "anon";

grant insert on table "public"."support_ticket_events" to "anon";

grant references on table "public"."support_ticket_events" to "anon";

grant select on table "public"."support_ticket_events" to "anon";

grant trigger on table "public"."support_ticket_events" to "anon";

grant truncate on table "public"."support_ticket_events" to "anon";

grant update on table "public"."support_ticket_events" to "anon";

grant delete on table "public"."support_ticket_events" to "authenticated";

grant insert on table "public"."support_ticket_events" to "authenticated";

grant references on table "public"."support_ticket_events" to "authenticated";

grant select on table "public"."support_ticket_events" to "authenticated";

grant trigger on table "public"."support_ticket_events" to "authenticated";

grant truncate on table "public"."support_ticket_events" to "authenticated";

grant update on table "public"."support_ticket_events" to "authenticated";

grant delete on table "public"."support_ticket_events" to "service_role";

grant insert on table "public"."support_ticket_events" to "service_role";

grant references on table "public"."support_ticket_events" to "service_role";

grant select on table "public"."support_ticket_events" to "service_role";

grant trigger on table "public"."support_ticket_events" to "service_role";

grant truncate on table "public"."support_ticket_events" to "service_role";

grant update on table "public"."support_ticket_events" to "service_role";

grant delete on table "public"."support_tickets" to "anon";

grant insert on table "public"."support_tickets" to "anon";

grant references on table "public"."support_tickets" to "anon";

grant select on table "public"."support_tickets" to "anon";

grant trigger on table "public"."support_tickets" to "anon";

grant truncate on table "public"."support_tickets" to "anon";

grant update on table "public"."support_tickets" to "anon";

grant delete on table "public"."support_tickets" to "authenticated";

grant insert on table "public"."support_tickets" to "authenticated";

grant references on table "public"."support_tickets" to "authenticated";

grant select on table "public"."support_tickets" to "authenticated";

grant trigger on table "public"."support_tickets" to "authenticated";

grant truncate on table "public"."support_tickets" to "authenticated";

grant update on table "public"."support_tickets" to "authenticated";

grant delete on table "public"."support_tickets" to "service_role";

grant insert on table "public"."support_tickets" to "service_role";

grant references on table "public"."support_tickets" to "service_role";

grant select on table "public"."support_tickets" to "service_role";

grant trigger on table "public"."support_tickets" to "service_role";

grant truncate on table "public"."support_tickets" to "service_role";

grant update on table "public"."support_tickets" to "service_role";


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


CREATE TRIGGER set_chat_conversations_updated_at BEFORE UPDATE ON public.chat_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER on_contractor_verification_update BEFORE UPDATE ON public.contractors FOR EACH ROW EXECUTE FUNCTION public.check_contractor_verification();

CREATE TRIGGER set_contractors_updated_at BEFORE UPDATE ON public.contractors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER on_job_broadcast_notify_contractors AFTER INSERT OR UPDATE OF status ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.notify_nearby_contractors();

CREATE TRIGGER on_job_completed_close_chat AFTER UPDATE OF status ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.close_conversation_on_job_complete();

CREATE TRIGGER on_job_status_changed AFTER UPDATE OF status ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_contractor_acceptance_rate();

CREATE TRIGGER set_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER on_profile_role_sync_contractor AFTER INSERT OR UPDATE OF role ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.sync_contractor_role_row();

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

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



