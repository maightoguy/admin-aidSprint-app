
  create table "public"."admin_action_log" (
    "id" uuid not null default gen_random_uuid(),
    "admin_id" uuid not null,
    "action_type" text not null,
    "resource_type" text not null,
    "resource_id" uuid not null,
    "reason" text,
    "metadata" jsonb default '{}'::jsonb,
    "result" text not null default 'success'::text,
    "error_message" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."admin_action_log" enable row level security;

CREATE UNIQUE INDEX admin_action_log_pkey ON public.admin_action_log USING btree (id);

CREATE INDEX idx_admin_action_log_action_type ON public.admin_action_log USING btree (action_type);

CREATE INDEX idx_admin_action_log_admin_created ON public.admin_action_log USING btree (admin_id, created_at DESC);

CREATE INDEX idx_admin_action_log_admin_id ON public.admin_action_log USING btree (admin_id);

CREATE INDEX idx_admin_action_log_created_at ON public.admin_action_log USING btree (created_at DESC);

CREATE INDEX idx_admin_action_log_resource_id ON public.admin_action_log USING btree (resource_id);

CREATE INDEX idx_admin_action_log_resource_type ON public.admin_action_log USING btree (resource_type);

CREATE INDEX idx_admin_action_log_result ON public.admin_action_log USING btree (result);

alter table "public"."admin_action_log" add constraint "admin_action_log_pkey" PRIMARY KEY using index "admin_action_log_pkey";

alter table "public"."admin_action_log" add constraint "admin_action_log_action_type_check" CHECK ((action_type = ANY (ARRAY['contractor_suspended'::text, 'contractor_restored'::text, 'contractor_kyc_approved'::text, 'contractor_kyc_rejected'::text, 'job_cancelled'::text, 'job_status_updated'::text, 'dispute_created'::text, 'dispute_resolved'::text, 'dispute_rejected'::text, 'support_ticket_created'::text, 'support_ticket_escalated'::text, 'support_ticket_resolved'::text, 'refund_initiated'::text, 'refund_completed'::text, 'refund_failed'::text, 'payout_approved'::text, 'payout_rejected'::text, 'payout_processed'::text, 'settings_category_created'::text, 'settings_category_updated'::text, 'settings_category_deleted'::text, 'settings_service_type_created'::text, 'settings_service_type_updated'::text, 'settings_service_type_deleted'::text, 'settings_urgency_tier_updated'::text, 'settings_promo_code_created'::text, 'settings_promo_code_deleted'::text, 'settings_notification_template_created'::text, 'settings_notification_template_deleted'::text, 'settings_notification_campaign_created'::text, 'settings_notification_campaign_deleted'::text, 'admin_password_changed'::text, 'admin_mfa_enabled'::text, 'admin_mfa_disabled'::text]))) not valid;

alter table "public"."admin_action_log" validate constraint "admin_action_log_action_type_check";

alter table "public"."admin_action_log" add constraint "admin_action_log_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."admin_action_log" validate constraint "admin_action_log_admin_id_fkey";

alter table "public"."admin_action_log" add constraint "admin_action_log_resource_type_check" CHECK ((resource_type = ANY (ARRAY['contractor'::text, 'contractor_document'::text, 'job'::text, 'dispute'::text, 'support_ticket'::text, 'payment'::text, 'withdrawal'::text, 'payout'::text, 'service_category'::text, 'service_type'::text, 'urgency_tier'::text, 'promo_code'::text, 'notification_template'::text, 'notification_campaign'::text, 'admin_profile'::text]))) not valid;

alter table "public"."admin_action_log" validate constraint "admin_action_log_resource_type_check";

alter table "public"."admin_action_log" add constraint "admin_action_log_result_check" CHECK ((result = ANY (ARRAY['success'::text, 'failure'::text]))) not valid;

alter table "public"."admin_action_log" validate constraint "admin_action_log_result_check";

grant delete on table "public"."admin_action_log" to "anon";

grant insert on table "public"."admin_action_log" to "anon";

grant references on table "public"."admin_action_log" to "anon";

grant select on table "public"."admin_action_log" to "anon";

grant trigger on table "public"."admin_action_log" to "anon";

grant truncate on table "public"."admin_action_log" to "anon";

grant update on table "public"."admin_action_log" to "anon";

grant delete on table "public"."admin_action_log" to "authenticated";

grant insert on table "public"."admin_action_log" to "authenticated";

grant references on table "public"."admin_action_log" to "authenticated";

grant select on table "public"."admin_action_log" to "authenticated";

grant trigger on table "public"."admin_action_log" to "authenticated";

grant truncate on table "public"."admin_action_log" to "authenticated";

grant update on table "public"."admin_action_log" to "authenticated";

grant delete on table "public"."admin_action_log" to "service_role";

grant insert on table "public"."admin_action_log" to "service_role";

grant references on table "public"."admin_action_log" to "service_role";

grant select on table "public"."admin_action_log" to "service_role";

grant trigger on table "public"."admin_action_log" to "service_role";

grant truncate on table "public"."admin_action_log" to "service_role";

grant update on table "public"."admin_action_log" to "service_role";


  create policy "admin_action_log_insert_service_role"
  on "public"."admin_action_log"
  as permissive
  for insert
  to public
with check ((auth.uid() IS NOT NULL));



  create policy "admin_action_log_select_admins"
  on "public"."admin_action_log"
  as permissive
  for select
  to public
using (public.is_admin_user());



