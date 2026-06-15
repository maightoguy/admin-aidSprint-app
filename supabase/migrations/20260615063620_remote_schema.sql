drop policy "Contractors can view available and assigned jobs" on "public"."jobs";


  create table "public"."finance_admin_events" (
    "id" uuid not null default gen_random_uuid(),
    "target_type" text not null,
    "payment_id" uuid,
    "withdrawal_id" uuid,
    "action" text not null,
    "reason" text not null default ''::text,
    "actor_id" uuid not null,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."finance_admin_events" enable row level security;

alter table "public"."payments" alter column "currency" set default 'cad'::text;

alter table "public"."service_types" add column "min_hours" integer not null default 1;

CREATE INDEX finance_admin_events_actor_id_idx ON public.finance_admin_events USING btree (actor_id);

CREATE INDEX finance_admin_events_created_at_idx ON public.finance_admin_events USING btree (created_at DESC);

CREATE INDEX finance_admin_events_payment_id_idx ON public.finance_admin_events USING btree (payment_id);

CREATE UNIQUE INDEX finance_admin_events_pkey ON public.finance_admin_events USING btree (id);

CREATE INDEX finance_admin_events_withdrawal_id_idx ON public.finance_admin_events USING btree (withdrawal_id);

alter table "public"."finance_admin_events" add constraint "finance_admin_events_pkey" PRIMARY KEY using index "finance_admin_events_pkey";

alter table "public"."finance_admin_events" add constraint "finance_admin_events_action_check" CHECK ((action = ANY (ARRAY['approve_payout'::text, 'reject_payout'::text, 'flag_for_review'::text, 'mark_reconciled'::text, 'request_reversal'::text]))) not valid;

alter table "public"."finance_admin_events" validate constraint "finance_admin_events_action_check";

alter table "public"."finance_admin_events" add constraint "finance_admin_events_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.profiles(id) not valid;

alter table "public"."finance_admin_events" validate constraint "finance_admin_events_actor_id_fkey";

alter table "public"."finance_admin_events" add constraint "finance_admin_events_payment_id_fkey" FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE not valid;

alter table "public"."finance_admin_events" validate constraint "finance_admin_events_payment_id_fkey";

alter table "public"."finance_admin_events" add constraint "finance_admin_events_target_fk_check" CHECK ((((target_type = 'payment'::text) AND (payment_id IS NOT NULL) AND (withdrawal_id IS NULL)) OR ((target_type = 'withdrawal'::text) AND (withdrawal_id IS NOT NULL) AND (payment_id IS NULL)))) not valid;

alter table "public"."finance_admin_events" validate constraint "finance_admin_events_target_fk_check";

alter table "public"."finance_admin_events" add constraint "finance_admin_events_target_type_check" CHECK ((target_type = ANY (ARRAY['payment'::text, 'withdrawal'::text]))) not valid;

alter table "public"."finance_admin_events" validate constraint "finance_admin_events_target_type_check";

alter table "public"."finance_admin_events" add constraint "finance_admin_events_withdrawal_id_fkey" FOREIGN KEY (withdrawal_id) REFERENCES public.withdrawals(id) ON DELETE CASCADE not valid;

alter table "public"."finance_admin_events" validate constraint "finance_admin_events_withdrawal_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.distance_km(p_latitude_a double precision, p_longitude_a double precision, p_latitude_b double precision, p_longitude_b double precision)
 RETURNS double precision
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
 SET search_path TO ''
AS $function$
  SELECT 6371.0 * acos(
    least(
      1.0,
      greatest(
        -1.0,
        cos(radians(p_latitude_a))
          * cos(radians(p_latitude_b))
          * cos(radians(p_longitude_b) - radians(p_longitude_a))
        + sin(radians(p_latitude_a))
          * sin(radians(p_latitude_b))
      )
    )
  );
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
      AND EXISTS (
        SELECT 1
        FROM unnest(contractor.services) AS offered_service
        WHERE lower(offered_service) = lower(NEW.service_type)
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

grant delete on table "public"."finance_admin_events" to "anon";

grant insert on table "public"."finance_admin_events" to "anon";

grant references on table "public"."finance_admin_events" to "anon";

grant select on table "public"."finance_admin_events" to "anon";

grant trigger on table "public"."finance_admin_events" to "anon";

grant truncate on table "public"."finance_admin_events" to "anon";

grant update on table "public"."finance_admin_events" to "anon";

grant delete on table "public"."finance_admin_events" to "authenticated";

grant insert on table "public"."finance_admin_events" to "authenticated";

grant references on table "public"."finance_admin_events" to "authenticated";

grant select on table "public"."finance_admin_events" to "authenticated";

grant trigger on table "public"."finance_admin_events" to "authenticated";

grant truncate on table "public"."finance_admin_events" to "authenticated";

grant update on table "public"."finance_admin_events" to "authenticated";

grant delete on table "public"."finance_admin_events" to "service_role";

grant insert on table "public"."finance_admin_events" to "service_role";

grant references on table "public"."finance_admin_events" to "service_role";

grant select on table "public"."finance_admin_events" to "service_role";

grant trigger on table "public"."finance_admin_events" to "service_role";

grant truncate on table "public"."finance_admin_events" to "service_role";

grant update on table "public"."finance_admin_events" to "service_role";


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



  create policy "Contractors can view available and assigned jobs"
  on "public"."jobs"
  as permissive
  for select
  to authenticated
using (((auth.uid() = contractor_id) OR ((status = 'broadcast'::text) AND public.is_contractor_eligible_for_job(jobs.*, (15)::double precision))));


CREATE TRIGGER on_job_broadcast_notify_contractors AFTER INSERT OR UPDATE OF status ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.notify_nearby_contractors();


