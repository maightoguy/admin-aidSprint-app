
  create table "public"."notification_campaigns" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text not null default ''::text,
    "channel" text not null,
    "template_id" uuid,
    "status" text not null default 'draft'::text,
    "audience_type" text not null default 'admins'::text,
    "audience_filter" jsonb not null default '{}'::jsonb,
    "schedule_type" text not null default 'manual'::text,
    "scheduled_at" timestamp with time zone,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_by_admin_id" uuid,
    "updated_by_admin_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."notification_campaigns" enable row level security;


  create table "public"."notification_deliveries" (
    "id" uuid not null default gen_random_uuid(),
    "campaign_id" uuid,
    "template_id" uuid,
    "recipient_id" uuid,
    "recipient_role" text,
    "channel" text not null,
    "status" text not null default 'queued'::text,
    "provider_message_id" text,
    "provider_error" text,
    "queued_at" timestamp with time zone not null default now(),
    "sent_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "failed_at" timestamp with time zone,
    "metadata" jsonb not null default '{}'::jsonb
      );


alter table "public"."notification_deliveries" enable row level security;


  create table "public"."notification_templates" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "channel" text not null,
    "title_template" text,
    "body_template" text not null default ''::text,
    "payload_template" jsonb not null default '{}'::jsonb,
    "is_active" boolean not null default true,
    "created_by_admin_id" uuid,
    "updated_by_admin_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."notification_templates" enable row level security;


  create table "public"."promo_code_redemptions" (
    "id" uuid not null default gen_random_uuid(),
    "promo_code_id" uuid not null,
    "user_id" uuid not null,
    "job_id" uuid,
    "payment_id" uuid,
    "discount_applied" numeric,
    "currency" text,
    "redeemed_at" timestamp with time zone not null default now(),
    "metadata" jsonb not null default '{}'::jsonb
      );


alter table "public"."promo_code_redemptions" enable row level security;


  create table "public"."promo_codes" (
    "id" uuid not null default gen_random_uuid(),
    "code" text not null,
    "description" text not null default ''::text,
    "discount_type" text not null,
    "discount_value" numeric not null,
    "discount_currency" text,
    "starts_on" date,
    "ends_on" date,
    "is_active" boolean not null default true,
    "max_redemptions_total" integer,
    "max_redemptions_per_user" integer,
    "min_job_amount" numeric,
    "created_by_admin_id" uuid,
    "updated_by_admin_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."promo_codes" enable row level security;

CREATE UNIQUE INDEX notification_campaigns_name_unique_idx ON public.notification_campaigns USING btree (lower(name));

CREATE UNIQUE INDEX notification_campaigns_pkey ON public.notification_campaigns USING btree (id);

CREATE INDEX notification_campaigns_status_idx ON public.notification_campaigns USING btree (status, updated_at DESC);

CREATE INDEX notification_deliveries_campaign_id_idx ON public.notification_deliveries USING btree (campaign_id, queued_at DESC);

CREATE UNIQUE INDEX notification_deliveries_pkey ON public.notification_deliveries USING btree (id);

CREATE INDEX notification_deliveries_recipient_id_idx ON public.notification_deliveries USING btree (recipient_id, queued_at DESC);

CREATE UNIQUE INDEX notification_templates_name_unique_idx ON public.notification_templates USING btree (lower(name));

CREATE UNIQUE INDEX notification_templates_pkey ON public.notification_templates USING btree (id);

CREATE UNIQUE INDEX promo_code_redemptions_pkey ON public.promo_code_redemptions USING btree (id);

CREATE INDEX promo_code_redemptions_promo_code_id_idx ON public.promo_code_redemptions USING btree (promo_code_id, redeemed_at DESC);

CREATE INDEX promo_code_redemptions_user_id_idx ON public.promo_code_redemptions USING btree (user_id, redeemed_at DESC);

CREATE UNIQUE INDEX promo_codes_code_unique ON public.promo_codes USING btree (code);

CREATE UNIQUE INDEX promo_codes_pkey ON public.promo_codes USING btree (id);

alter table "public"."notification_campaigns" add constraint "notification_campaigns_pkey" PRIMARY KEY using index "notification_campaigns_pkey";

alter table "public"."notification_deliveries" add constraint "notification_deliveries_pkey" PRIMARY KEY using index "notification_deliveries_pkey";

alter table "public"."notification_templates" add constraint "notification_templates_pkey" PRIMARY KEY using index "notification_templates_pkey";

alter table "public"."promo_code_redemptions" add constraint "promo_code_redemptions_pkey" PRIMARY KEY using index "promo_code_redemptions_pkey";

alter table "public"."promo_codes" add constraint "promo_codes_pkey" PRIMARY KEY using index "promo_codes_pkey";

alter table "public"."notification_campaigns" add constraint "notification_campaigns_audience_type_check" CHECK ((audience_type = ANY (ARRAY['admins'::text, 'users'::text, 'contractors'::text, 'segment'::text]))) not valid;

alter table "public"."notification_campaigns" validate constraint "notification_campaigns_audience_type_check";

alter table "public"."notification_campaigns" add constraint "notification_campaigns_channel_check" CHECK ((channel = ANY (ARRAY['push'::text, 'email'::text, 'sms'::text]))) not valid;

alter table "public"."notification_campaigns" validate constraint "notification_campaigns_channel_check";

alter table "public"."notification_campaigns" add constraint "notification_campaigns_created_by_admin_id_fkey" FOREIGN KEY (created_by_admin_id) REFERENCES public.profiles(id) not valid;

alter table "public"."notification_campaigns" validate constraint "notification_campaigns_created_by_admin_id_fkey";

alter table "public"."notification_campaigns" add constraint "notification_campaigns_schedule_type_check" CHECK ((schedule_type = ANY (ARRAY['manual'::text, 'immediate'::text, 'scheduled'::text]))) not valid;

alter table "public"."notification_campaigns" validate constraint "notification_campaigns_schedule_type_check";

alter table "public"."notification_campaigns" add constraint "notification_campaigns_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'enabled'::text, 'disabled'::text, 'archived'::text]))) not valid;

alter table "public"."notification_campaigns" validate constraint "notification_campaigns_status_check";

alter table "public"."notification_campaigns" add constraint "notification_campaigns_template_id_fkey" FOREIGN KEY (template_id) REFERENCES public.notification_templates(id) ON DELETE SET NULL not valid;

alter table "public"."notification_campaigns" validate constraint "notification_campaigns_template_id_fkey";

alter table "public"."notification_campaigns" add constraint "notification_campaigns_updated_by_admin_id_fkey" FOREIGN KEY (updated_by_admin_id) REFERENCES public.profiles(id) not valid;

alter table "public"."notification_campaigns" validate constraint "notification_campaigns_updated_by_admin_id_fkey";

alter table "public"."notification_deliveries" add constraint "notification_deliveries_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES public.notification_campaigns(id) ON DELETE SET NULL not valid;

alter table "public"."notification_deliveries" validate constraint "notification_deliveries_campaign_id_fkey";

alter table "public"."notification_deliveries" add constraint "notification_deliveries_channel_check" CHECK ((channel = ANY (ARRAY['push'::text, 'email'::text, 'sms'::text]))) not valid;

alter table "public"."notification_deliveries" validate constraint "notification_deliveries_channel_check";

alter table "public"."notification_deliveries" add constraint "notification_deliveries_recipient_id_fkey" FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."notification_deliveries" validate constraint "notification_deliveries_recipient_id_fkey";

alter table "public"."notification_deliveries" add constraint "notification_deliveries_status_check" CHECK ((status = ANY (ARRAY['queued'::text, 'sending'::text, 'sent'::text, 'delivered'::text, 'failed'::text, 'canceled'::text]))) not valid;

alter table "public"."notification_deliveries" validate constraint "notification_deliveries_status_check";

alter table "public"."notification_deliveries" add constraint "notification_deliveries_template_id_fkey" FOREIGN KEY (template_id) REFERENCES public.notification_templates(id) ON DELETE SET NULL not valid;

alter table "public"."notification_deliveries" validate constraint "notification_deliveries_template_id_fkey";

alter table "public"."notification_templates" add constraint "notification_templates_channel_check" CHECK ((channel = ANY (ARRAY['push'::text, 'email'::text, 'sms'::text]))) not valid;

alter table "public"."notification_templates" validate constraint "notification_templates_channel_check";

alter table "public"."notification_templates" add constraint "notification_templates_created_by_admin_id_fkey" FOREIGN KEY (created_by_admin_id) REFERENCES public.profiles(id) not valid;

alter table "public"."notification_templates" validate constraint "notification_templates_created_by_admin_id_fkey";

alter table "public"."notification_templates" add constraint "notification_templates_updated_by_admin_id_fkey" FOREIGN KEY (updated_by_admin_id) REFERENCES public.profiles(id) not valid;

alter table "public"."notification_templates" validate constraint "notification_templates_updated_by_admin_id_fkey";

alter table "public"."promo_code_redemptions" add constraint "promo_code_redemptions_promo_code_id_fkey" FOREIGN KEY (promo_code_id) REFERENCES public.promo_codes(id) ON DELETE CASCADE not valid;

alter table "public"."promo_code_redemptions" validate constraint "promo_code_redemptions_promo_code_id_fkey";

alter table "public"."promo_code_redemptions" add constraint "promo_code_redemptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."promo_code_redemptions" validate constraint "promo_code_redemptions_user_id_fkey";

alter table "public"."promo_codes" add constraint "promo_codes_amount_currency_check" CHECK (((discount_type <> 'amount'::text) OR (discount_currency IS NOT NULL))) not valid;

alter table "public"."promo_codes" validate constraint "promo_codes_amount_currency_check";

alter table "public"."promo_codes" add constraint "promo_codes_code_unique" UNIQUE using index "promo_codes_code_unique";

alter table "public"."promo_codes" add constraint "promo_codes_created_by_admin_id_fkey" FOREIGN KEY (created_by_admin_id) REFERENCES public.profiles(id) not valid;

alter table "public"."promo_codes" validate constraint "promo_codes_created_by_admin_id_fkey";

alter table "public"."promo_codes" add constraint "promo_codes_date_range_check" CHECK (((starts_on IS NULL) OR (ends_on IS NULL) OR (ends_on >= starts_on))) not valid;

alter table "public"."promo_codes" validate constraint "promo_codes_date_range_check";

alter table "public"."promo_codes" add constraint "promo_codes_discount_type_check" CHECK ((discount_type = ANY (ARRAY['percent'::text, 'amount'::text]))) not valid;

alter table "public"."promo_codes" validate constraint "promo_codes_discount_type_check";

alter table "public"."promo_codes" add constraint "promo_codes_discount_value_check" CHECK ((discount_value > (0)::numeric)) not valid;

alter table "public"."promo_codes" validate constraint "promo_codes_discount_value_check";

alter table "public"."promo_codes" add constraint "promo_codes_updated_by_admin_id_fkey" FOREIGN KEY (updated_by_admin_id) REFERENCES public.profiles(id) not valid;

alter table "public"."promo_codes" validate constraint "promo_codes_updated_by_admin_id_fkey";

grant delete on table "public"."notification_campaigns" to "anon";

grant insert on table "public"."notification_campaigns" to "anon";

grant references on table "public"."notification_campaigns" to "anon";

grant select on table "public"."notification_campaigns" to "anon";

grant trigger on table "public"."notification_campaigns" to "anon";

grant truncate on table "public"."notification_campaigns" to "anon";

grant update on table "public"."notification_campaigns" to "anon";

grant delete on table "public"."notification_campaigns" to "authenticated";

grant insert on table "public"."notification_campaigns" to "authenticated";

grant references on table "public"."notification_campaigns" to "authenticated";

grant select on table "public"."notification_campaigns" to "authenticated";

grant trigger on table "public"."notification_campaigns" to "authenticated";

grant truncate on table "public"."notification_campaigns" to "authenticated";

grant update on table "public"."notification_campaigns" to "authenticated";

grant delete on table "public"."notification_campaigns" to "service_role";

grant insert on table "public"."notification_campaigns" to "service_role";

grant references on table "public"."notification_campaigns" to "service_role";

grant select on table "public"."notification_campaigns" to "service_role";

grant trigger on table "public"."notification_campaigns" to "service_role";

grant truncate on table "public"."notification_campaigns" to "service_role";

grant update on table "public"."notification_campaigns" to "service_role";

grant delete on table "public"."notification_deliveries" to "anon";

grant insert on table "public"."notification_deliveries" to "anon";

grant references on table "public"."notification_deliveries" to "anon";

grant select on table "public"."notification_deliveries" to "anon";

grant trigger on table "public"."notification_deliveries" to "anon";

grant truncate on table "public"."notification_deliveries" to "anon";

grant update on table "public"."notification_deliveries" to "anon";

grant delete on table "public"."notification_deliveries" to "authenticated";

grant insert on table "public"."notification_deliveries" to "authenticated";

grant references on table "public"."notification_deliveries" to "authenticated";

grant select on table "public"."notification_deliveries" to "authenticated";

grant trigger on table "public"."notification_deliveries" to "authenticated";

grant truncate on table "public"."notification_deliveries" to "authenticated";

grant update on table "public"."notification_deliveries" to "authenticated";

grant delete on table "public"."notification_deliveries" to "service_role";

grant insert on table "public"."notification_deliveries" to "service_role";

grant references on table "public"."notification_deliveries" to "service_role";

grant select on table "public"."notification_deliveries" to "service_role";

grant trigger on table "public"."notification_deliveries" to "service_role";

grant truncate on table "public"."notification_deliveries" to "service_role";

grant update on table "public"."notification_deliveries" to "service_role";

grant delete on table "public"."notification_templates" to "anon";

grant insert on table "public"."notification_templates" to "anon";

grant references on table "public"."notification_templates" to "anon";

grant select on table "public"."notification_templates" to "anon";

grant trigger on table "public"."notification_templates" to "anon";

grant truncate on table "public"."notification_templates" to "anon";

grant update on table "public"."notification_templates" to "anon";

grant delete on table "public"."notification_templates" to "authenticated";

grant insert on table "public"."notification_templates" to "authenticated";

grant references on table "public"."notification_templates" to "authenticated";

grant select on table "public"."notification_templates" to "authenticated";

grant trigger on table "public"."notification_templates" to "authenticated";

grant truncate on table "public"."notification_templates" to "authenticated";

grant update on table "public"."notification_templates" to "authenticated";

grant delete on table "public"."notification_templates" to "service_role";

grant insert on table "public"."notification_templates" to "service_role";

grant references on table "public"."notification_templates" to "service_role";

grant select on table "public"."notification_templates" to "service_role";

grant trigger on table "public"."notification_templates" to "service_role";

grant truncate on table "public"."notification_templates" to "service_role";

grant update on table "public"."notification_templates" to "service_role";

grant delete on table "public"."promo_code_redemptions" to "anon";

grant insert on table "public"."promo_code_redemptions" to "anon";

grant references on table "public"."promo_code_redemptions" to "anon";

grant select on table "public"."promo_code_redemptions" to "anon";

grant trigger on table "public"."promo_code_redemptions" to "anon";

grant truncate on table "public"."promo_code_redemptions" to "anon";

grant update on table "public"."promo_code_redemptions" to "anon";

grant delete on table "public"."promo_code_redemptions" to "authenticated";

grant insert on table "public"."promo_code_redemptions" to "authenticated";

grant references on table "public"."promo_code_redemptions" to "authenticated";

grant select on table "public"."promo_code_redemptions" to "authenticated";

grant trigger on table "public"."promo_code_redemptions" to "authenticated";

grant truncate on table "public"."promo_code_redemptions" to "authenticated";

grant update on table "public"."promo_code_redemptions" to "authenticated";

grant delete on table "public"."promo_code_redemptions" to "service_role";

grant insert on table "public"."promo_code_redemptions" to "service_role";

grant references on table "public"."promo_code_redemptions" to "service_role";

grant select on table "public"."promo_code_redemptions" to "service_role";

grant trigger on table "public"."promo_code_redemptions" to "service_role";

grant truncate on table "public"."promo_code_redemptions" to "service_role";

grant update on table "public"."promo_code_redemptions" to "service_role";

grant delete on table "public"."promo_codes" to "anon";

grant insert on table "public"."promo_codes" to "anon";

grant references on table "public"."promo_codes" to "anon";

grant select on table "public"."promo_codes" to "anon";

grant trigger on table "public"."promo_codes" to "anon";

grant truncate on table "public"."promo_codes" to "anon";

grant update on table "public"."promo_codes" to "anon";

grant delete on table "public"."promo_codes" to "authenticated";

grant insert on table "public"."promo_codes" to "authenticated";

grant references on table "public"."promo_codes" to "authenticated";

grant select on table "public"."promo_codes" to "authenticated";

grant trigger on table "public"."promo_codes" to "authenticated";

grant truncate on table "public"."promo_codes" to "authenticated";

grant update on table "public"."promo_codes" to "authenticated";

grant delete on table "public"."promo_codes" to "service_role";

grant insert on table "public"."promo_codes" to "service_role";

grant references on table "public"."promo_codes" to "service_role";

grant select on table "public"."promo_codes" to "service_role";

grant trigger on table "public"."promo_codes" to "service_role";

grant truncate on table "public"."promo_codes" to "service_role";

grant update on table "public"."promo_codes" to "service_role";


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


CREATE TRIGGER set_notification_campaigns_updated_at BEFORE UPDATE ON public.notification_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_notification_templates_updated_at BEFORE UPDATE ON public.notification_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_promo_codes_updated_at BEFORE UPDATE ON public.promo_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


