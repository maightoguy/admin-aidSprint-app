
  create table "public"."finance_audit_log" (
    "id" uuid not null default gen_random_uuid(),
    "admin_id" uuid not null,
    "action" text not null,
    "dispute_id" uuid,
    "payment_id" uuid,
    "amount" numeric(10,2),
    "reason" text,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."finance_audit_log" enable row level security;

alter table "public"."disputes" add column "refund_status" text;

alter table "public"."payments" add column "refund_initiated_by" uuid;

alter table "public"."payments" add column "refund_reason" text;

CREATE UNIQUE INDEX finance_audit_log_pkey ON public.finance_audit_log USING btree (id);

CREATE INDEX idx_disputes_refund_status ON public.disputes USING btree (refund_status) WHERE (refund_status IS NOT NULL);

CREATE INDEX idx_disputes_related_payment_id ON public.disputes USING btree (related_payment_id) WHERE (related_payment_id IS NOT NULL);

CREATE INDEX idx_finance_audit_log_action ON public.finance_audit_log USING btree (action);

CREATE INDEX idx_finance_audit_log_admin ON public.finance_audit_log USING btree (admin_id);

CREATE INDEX idx_finance_audit_log_created ON public.finance_audit_log USING btree (created_at DESC);

CREATE INDEX idx_finance_audit_log_dispute ON public.finance_audit_log USING btree (dispute_id) WHERE (dispute_id IS NOT NULL);

CREATE INDEX idx_finance_audit_log_payment ON public.finance_audit_log USING btree (payment_id) WHERE (payment_id IS NOT NULL);

CREATE INDEX idx_payments_refund_initiated_by ON public.payments USING btree (refund_initiated_by) WHERE (refund_initiated_by IS NOT NULL);

alter table "public"."finance_audit_log" add constraint "finance_audit_log_pkey" PRIMARY KEY using index "finance_audit_log_pkey";

alter table "public"."disputes" add constraint "disputes_refund_status_check" CHECK (((refund_status IS NULL) OR (refund_status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])))) not valid;

alter table "public"."disputes" validate constraint "disputes_refund_status_check";

alter table "public"."finance_audit_log" add constraint "finance_audit_log_action_check" CHECK ((action = ANY (ARRAY['refund_initiated'::text, 'refund_completed'::text, 'refund_failed'::text, 'reversal_initiated'::text, 'chargeback_initiated'::text]))) not valid;

alter table "public"."finance_audit_log" validate constraint "finance_audit_log_action_check";

alter table "public"."finance_audit_log" add constraint "finance_audit_log_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES public.profiles(id) not valid;

alter table "public"."finance_audit_log" validate constraint "finance_audit_log_admin_id_fkey";

alter table "public"."finance_audit_log" add constraint "finance_audit_log_dispute_id_fkey" FOREIGN KEY (dispute_id) REFERENCES public.disputes(id) ON DELETE SET NULL not valid;

alter table "public"."finance_audit_log" validate constraint "finance_audit_log_dispute_id_fkey";

alter table "public"."finance_audit_log" add constraint "finance_audit_log_payment_id_fkey" FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL not valid;

alter table "public"."finance_audit_log" validate constraint "finance_audit_log_payment_id_fkey";

alter table "public"."payments" add constraint "payments_refund_initiated_by_fkey" FOREIGN KEY (refund_initiated_by) REFERENCES public.profiles(id) not valid;

alter table "public"."payments" validate constraint "payments_refund_initiated_by_fkey";

grant delete on table "public"."finance_audit_log" to "anon";

grant insert on table "public"."finance_audit_log" to "anon";

grant references on table "public"."finance_audit_log" to "anon";

grant select on table "public"."finance_audit_log" to "anon";

grant trigger on table "public"."finance_audit_log" to "anon";

grant truncate on table "public"."finance_audit_log" to "anon";

grant update on table "public"."finance_audit_log" to "anon";

grant delete on table "public"."finance_audit_log" to "authenticated";

grant insert on table "public"."finance_audit_log" to "authenticated";

grant references on table "public"."finance_audit_log" to "authenticated";

grant select on table "public"."finance_audit_log" to "authenticated";

grant trigger on table "public"."finance_audit_log" to "authenticated";

grant truncate on table "public"."finance_audit_log" to "authenticated";

grant update on table "public"."finance_audit_log" to "authenticated";

grant delete on table "public"."finance_audit_log" to "service_role";

grant insert on table "public"."finance_audit_log" to "service_role";

grant references on table "public"."finance_audit_log" to "service_role";

grant select on table "public"."finance_audit_log" to "service_role";

grant trigger on table "public"."finance_audit_log" to "service_role";

grant truncate on table "public"."finance_audit_log" to "service_role";

grant update on table "public"."finance_audit_log" to "service_role";


  create policy "Admins can update refund status on disputes"
  on "public"."disputes"
  as permissive
  for update
  to public
using ((public.is_admin_user() AND (resolution_type = ANY (ARRAY['refund'::text, 'partial_refund'::text]))))
with check (public.is_admin_user());



  create policy "Admins can view finance audit log"
  on "public"."finance_audit_log"
  as permissive
  for select
  to public
using (public.is_admin_user());



  create policy "Admins can update refund fields on payments"
  on "public"."payments"
  as permissive
  for update
  to public
using (public.is_admin_user())
with check (public.is_admin_user());



