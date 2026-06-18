
  create table "public"."admin_mfa_recovery_codes" (
    "id" uuid not null default gen_random_uuid(),
    "admin_user_id" uuid not null,
    "code_hash" text not null,
    "generated_at" timestamp with time zone not null default now(),
    "consumed_at" timestamp with time zone,
    "consumed_by_ip" inet,
    "metadata" jsonb not null default '{}'::jsonb
      );


alter table "public"."admin_mfa_recovery_codes" enable row level security;


  create table "public"."admin_security_events" (
    "id" uuid not null default gen_random_uuid(),
    "admin_user_id" uuid not null,
    "actor_id" uuid not null,
    "action" text not null,
    "reason" text not null default ''::text,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."admin_security_events" enable row level security;


  create table "public"."admin_security_settings" (
    "admin_user_id" uuid not null,
    "mfa_policy" text not null default 'optional'::text,
    "recovery_codes_generated_at" timestamp with time zone,
    "last_reauth_at" timestamp with time zone,
    "last_mfa_reset_requested_at" timestamp with time zone,
    "last_mfa_reset_by" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."admin_security_settings" enable row level security;

alter table "public"."withdrawals" add column "currency" text not null default 'cad'::text;

CREATE INDEX admin_mfa_recovery_codes_admin_user_id_idx ON public.admin_mfa_recovery_codes USING btree (admin_user_id);

CREATE INDEX admin_mfa_recovery_codes_available_idx ON public.admin_mfa_recovery_codes USING btree (admin_user_id, consumed_at);

CREATE UNIQUE INDEX admin_mfa_recovery_codes_pkey ON public.admin_mfa_recovery_codes USING btree (id);

CREATE UNIQUE INDEX admin_mfa_recovery_codes_unique_hash ON public.admin_mfa_recovery_codes USING btree (admin_user_id, code_hash);

CREATE INDEX admin_security_events_actor_id_created_at_idx ON public.admin_security_events USING btree (actor_id, created_at DESC);

CREATE INDEX admin_security_events_admin_user_id_created_at_idx ON public.admin_security_events USING btree (admin_user_id, created_at DESC);

CREATE UNIQUE INDEX admin_security_events_pkey ON public.admin_security_events USING btree (id);

CREATE UNIQUE INDEX admin_security_settings_pkey ON public.admin_security_settings USING btree (admin_user_id);

alter table "public"."admin_mfa_recovery_codes" add constraint "admin_mfa_recovery_codes_pkey" PRIMARY KEY using index "admin_mfa_recovery_codes_pkey";

alter table "public"."admin_security_events" add constraint "admin_security_events_pkey" PRIMARY KEY using index "admin_security_events_pkey";

alter table "public"."admin_security_settings" add constraint "admin_security_settings_pkey" PRIMARY KEY using index "admin_security_settings_pkey";

alter table "public"."admin_mfa_recovery_codes" add constraint "admin_mfa_recovery_codes_admin_user_id_fkey" FOREIGN KEY (admin_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."admin_mfa_recovery_codes" validate constraint "admin_mfa_recovery_codes_admin_user_id_fkey";

alter table "public"."admin_mfa_recovery_codes" add constraint "admin_mfa_recovery_codes_unique_hash" UNIQUE using index "admin_mfa_recovery_codes_unique_hash";

alter table "public"."admin_security_events" add constraint "admin_security_events_action_check" CHECK ((action = ANY (ARRAY['mfa_enrolled'::text, 'mfa_challenged'::text, 'mfa_verified'::text, 'recovery_codes_generated'::text, 'recovery_code_used'::text, 'mfa_reset_requested'::text, 'mfa_disabled'::text, 'password_changed'::text]))) not valid;

alter table "public"."admin_security_events" validate constraint "admin_security_events_action_check";

alter table "public"."admin_security_events" add constraint "admin_security_events_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.profiles(id) not valid;

alter table "public"."admin_security_events" validate constraint "admin_security_events_actor_id_fkey";

alter table "public"."admin_security_events" add constraint "admin_security_events_admin_user_id_fkey" FOREIGN KEY (admin_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."admin_security_events" validate constraint "admin_security_events_admin_user_id_fkey";

alter table "public"."admin_security_settings" add constraint "admin_security_settings_admin_user_id_fkey" FOREIGN KEY (admin_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."admin_security_settings" validate constraint "admin_security_settings_admin_user_id_fkey";

alter table "public"."admin_security_settings" add constraint "admin_security_settings_last_mfa_reset_by_fkey" FOREIGN KEY (last_mfa_reset_by) REFERENCES public.profiles(id) not valid;

alter table "public"."admin_security_settings" validate constraint "admin_security_settings_last_mfa_reset_by_fkey";

alter table "public"."admin_security_settings" add constraint "admin_security_settings_mfa_policy_check" CHECK ((mfa_policy = ANY (ARRAY['optional'::text, 'required'::text]))) not valid;

alter table "public"."admin_security_settings" validate constraint "admin_security_settings_mfa_policy_check";

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

CREATE OR REPLACE FUNCTION public.notify_nearby_contractors()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NEW.status = 'broadcast'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'broadcast') THEN
    INSERT INTO public.notifications (
      recipient_id,
      title,
      body,
      type,
      data
    )
    SELECT
      contractor.id,
      'New nearby request',
      NEW.service_type || ' request within 15 km',
      'job_request',
      jsonb_build_object('job_id', NEW.id)
    FROM public.contractors AS contractor
    WHERE contractor.availability_status = 'online'
      AND contractor.is_verified = true
      AND contractor.current_latitude IS NOT NULL
      AND contractor.current_longitude IS NOT NULL
      AND NOT (NEW.latitude = 0 AND NEW.longitude = 0)
      AND (
        EXISTS (
          SELECT 1
          FROM unnest(contractor.services) AS offered_service
          WHERE lower(offered_service) = lower(NEW.service_type)
        )
        OR EXISTS (
          SELECT 1
          FROM public.service_categories AS category
          CROSS JOIN LATERAL unnest(contractor.services) AS offered_service
          WHERE category.id = NEW.service_category_id
            AND lower(offered_service) = lower(category.name)
        )
        OR EXISTS (
          SELECT 1
          FROM public.service_types AS service_type
          JOIN public.service_categories AS category
            ON category.id = service_type.category_id
          CROSS JOIN LATERAL unnest(contractor.services) AS offered_service
          WHERE service_type.id = NEW.service_type_id
            AND (
              lower(offered_service) = lower(service_type.name)
              OR lower(offered_service) = lower(category.name)
            )
        )
      )
      AND public.distance_km(
        contractor.current_latitude,
        contractor.current_longitude,
        NEW.latitude,
        NEW.longitude
      ) <= 15;
  END IF;

  RETURN NEW;
END;
$function$
;

grant delete on table "public"."admin_mfa_recovery_codes" to "anon";

grant insert on table "public"."admin_mfa_recovery_codes" to "anon";

grant references on table "public"."admin_mfa_recovery_codes" to "anon";

grant select on table "public"."admin_mfa_recovery_codes" to "anon";

grant trigger on table "public"."admin_mfa_recovery_codes" to "anon";

grant truncate on table "public"."admin_mfa_recovery_codes" to "anon";

grant update on table "public"."admin_mfa_recovery_codes" to "anon";

grant delete on table "public"."admin_mfa_recovery_codes" to "authenticated";

grant insert on table "public"."admin_mfa_recovery_codes" to "authenticated";

grant references on table "public"."admin_mfa_recovery_codes" to "authenticated";

grant select on table "public"."admin_mfa_recovery_codes" to "authenticated";

grant trigger on table "public"."admin_mfa_recovery_codes" to "authenticated";

grant truncate on table "public"."admin_mfa_recovery_codes" to "authenticated";

grant update on table "public"."admin_mfa_recovery_codes" to "authenticated";

grant delete on table "public"."admin_mfa_recovery_codes" to "service_role";

grant insert on table "public"."admin_mfa_recovery_codes" to "service_role";

grant references on table "public"."admin_mfa_recovery_codes" to "service_role";

grant select on table "public"."admin_mfa_recovery_codes" to "service_role";

grant trigger on table "public"."admin_mfa_recovery_codes" to "service_role";

grant truncate on table "public"."admin_mfa_recovery_codes" to "service_role";

grant update on table "public"."admin_mfa_recovery_codes" to "service_role";

grant delete on table "public"."admin_security_events" to "anon";

grant insert on table "public"."admin_security_events" to "anon";

grant references on table "public"."admin_security_events" to "anon";

grant select on table "public"."admin_security_events" to "anon";

grant trigger on table "public"."admin_security_events" to "anon";

grant truncate on table "public"."admin_security_events" to "anon";

grant update on table "public"."admin_security_events" to "anon";

grant delete on table "public"."admin_security_events" to "authenticated";

grant insert on table "public"."admin_security_events" to "authenticated";

grant references on table "public"."admin_security_events" to "authenticated";

grant select on table "public"."admin_security_events" to "authenticated";

grant trigger on table "public"."admin_security_events" to "authenticated";

grant truncate on table "public"."admin_security_events" to "authenticated";

grant update on table "public"."admin_security_events" to "authenticated";

grant delete on table "public"."admin_security_events" to "service_role";

grant insert on table "public"."admin_security_events" to "service_role";

grant references on table "public"."admin_security_events" to "service_role";

grant select on table "public"."admin_security_events" to "service_role";

grant trigger on table "public"."admin_security_events" to "service_role";

grant truncate on table "public"."admin_security_events" to "service_role";

grant update on table "public"."admin_security_events" to "service_role";

grant delete on table "public"."admin_security_settings" to "anon";

grant insert on table "public"."admin_security_settings" to "anon";

grant references on table "public"."admin_security_settings" to "anon";

grant select on table "public"."admin_security_settings" to "anon";

grant trigger on table "public"."admin_security_settings" to "anon";

grant truncate on table "public"."admin_security_settings" to "anon";

grant update on table "public"."admin_security_settings" to "anon";

grant delete on table "public"."admin_security_settings" to "authenticated";

grant insert on table "public"."admin_security_settings" to "authenticated";

grant references on table "public"."admin_security_settings" to "authenticated";

grant select on table "public"."admin_security_settings" to "authenticated";

grant trigger on table "public"."admin_security_settings" to "authenticated";

grant truncate on table "public"."admin_security_settings" to "authenticated";

grant update on table "public"."admin_security_settings" to "authenticated";

grant delete on table "public"."admin_security_settings" to "service_role";

grant insert on table "public"."admin_security_settings" to "service_role";

grant references on table "public"."admin_security_settings" to "service_role";

grant select on table "public"."admin_security_settings" to "service_role";

grant trigger on table "public"."admin_security_settings" to "service_role";

grant truncate on table "public"."admin_security_settings" to "service_role";

grant update on table "public"."admin_security_settings" to "service_role";


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


CREATE TRIGGER set_admin_security_settings_updated_at BEFORE UPDATE ON public.admin_security_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


