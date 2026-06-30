


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "contractor_id" "uuid",
    "service_category_id" "uuid",
    "service_type_id" "uuid",
    "service_type" "text" DEFAULT ''::"text" NOT NULL,
    "urgency_tier" "text" DEFAULT 'standard'::"text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "hours" integer DEFAULT 1 NOT NULL,
    "base_price" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "urgency_fee" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "platform_fee" numeric(10,2) DEFAULT 4.99 NOT NULL,
    "price_estimate" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "final_price" numeric(10,2),
    "status" "text" DEFAULT 'requested'::"text" NOT NULL,
    "cancellation_reason" "text",
    "cancelled_by" "uuid",
    "latitude" double precision DEFAULT 0 NOT NULL,
    "longitude" double precision DEFAULT 0 NOT NULL,
    "address" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "accepted_at" timestamp with time zone,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    CONSTRAINT "jobs_status_check" CHECK (("status" = ANY (ARRAY['requested'::"text", 'broadcast'::"text", 'accepted'::"text", 'contractor_en_route'::"text", 'arrived'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "jobs_urgency_tier_check" CHECK (("urgency_tier" = ANY (ARRAY['standard'::"text", 'urgent'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."jobs" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_job"("p_job_id" "uuid", "p_contractor_id" "uuid") RETURNS "public"."jobs"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "public"."accept_job"("p_job_id" "uuid", "p_contractor_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_contractor_verification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  has_approved_id boolean;
  has_approved_police boolean;
  has_approved_service_licence boolean;
  has_any_pending_or_rejected boolean;
begin
  -- Derive verification flags from actual contractor_documents rows.
  -- This prevents clients (Android) from setting flags to true when
  -- documents are still pending or not yet admin-reviewed.

  select exists(
    select 1 from public.contractor_documents
    where contractor_id = new.id
      and document_type in ('government_id', 'drivers_licence', 'passport', 'national_id')
      and status = 'approved'
  ) into has_approved_id;

  select exists(
    select 1 from public.contractor_documents
    where contractor_id = new.id
      and document_type = 'police_check'
      and status = 'approved'
  ) into has_approved_police;

  select exists(
    select 1 from public.contractor_documents
    where contractor_id = new.id
      and document_type = 'service_licence'
      and status = 'approved'
  ) into has_approved_service_licence;

  -- Derive the flags from actual document approval state
  new.id_verification_complete := has_approved_id;
  new.police_check_complete := has_approved_police;
  new.service_licences_complete := has_approved_service_licence;

  -- Only mark as verified when ALL required documents are approved
  if has_approved_id and has_approved_police and has_approved_service_licence then
    new.is_verified := true;

    -- Promote out of pending_approval when fully verified
    if new.availability_status = 'pending_approval' then
      new.availability_status := 'offline';
    end if;
  else
    -- Check if there are any pending or rejected documents that should
    -- cause is_verified to be reset
    select exists(
      select 1 from public.contractor_documents
      where contractor_id = new.id
        and status in ('pending', 'rejected')
    ) into has_any_pending_or_rejected;

    if has_any_pending_or_rejected then
      new.is_verified := false;
    end if;
    -- Note: if there are NO documents at all, we leave is_verified unchanged
    -- to avoid resetting legacy contractors that were verified before the
    -- contractor_documents table was introduced.
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."check_contractor_verification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."close_conversation_on_job_complete"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  IF NEW.status IN ('completed', 'cancelled') AND OLD.status NOT IN ('completed', 'cancelled') THEN
    UPDATE public.chat_conversations SET status = 'closed' WHERE job_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."close_conversation_on_job_complete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."distance_km"("p_latitude_a" double precision, "p_longitude_a" double precision, "p_latitude_b" double precision, "p_longitude_b" double precision) RETURNS double precision
    LANGUAGE "sql" IMMUTABLE STRICT PARALLEL SAFE
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "public"."distance_km"("p_latitude_a" double precision, "p_longitude_a" double precision, "p_latitude_b" double precision, "p_longitude_b" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_nearby_broadcast_jobs"("p_radius_km" double precision DEFAULT 15) RETURNS SETOF "public"."jobs"
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "public"."get_nearby_broadcast_jobs"("p_radius_km" double precision) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contractors" (
    "id" "uuid" NOT NULL,
    "services" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "certifications" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "rating" numeric(3,2) DEFAULT 0.00 NOT NULL,
    "total_ratings" integer DEFAULT 0 NOT NULL,
    "acceptance_rate" numeric(5,4) DEFAULT 0.0000 NOT NULL,
    "total_jobs_offered" integer DEFAULT 0 NOT NULL,
    "total_jobs_accepted" integer DEFAULT 0 NOT NULL,
    "availability_status" "text" DEFAULT 'offline'::"text" NOT NULL,
    "current_latitude" double precision,
    "current_longitude" double precision,
    "location_updated_at" timestamp with time zone,
    "is_verified" boolean DEFAULT false NOT NULL,
    "id_verification_complete" boolean DEFAULT false NOT NULL,
    "police_check_complete" boolean DEFAULT false NOT NULL,
    "service_licences_complete" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "stripe_account_id" "text",
    "stripe_onboarding_completed" boolean DEFAULT false NOT NULL,
    "stripe_charges_enabled" boolean DEFAULT false NOT NULL,
    "stripe_payouts_enabled" boolean DEFAULT false NOT NULL,
    "payouts_blocked_reason" "text",
    "suspended_at" timestamp with time zone,
    "suspended_by" "uuid",
    "suspension_reason" "text",
    "restored_at" timestamp with time zone,
    "restored_by" "uuid",
    "restore_reason" "text",
    CONSTRAINT "contractors_availability_status_check" CHECK (("availability_status" = ANY (ARRAY['online'::"text", 'offline'::"text", 'busy'::"text", 'pending_approval'::"text"])))
);


ALTER TABLE "public"."contractors" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_nearby_contractors"("p_service_type" "text", "p_latitude" double precision, "p_longitude" double precision, "p_radius_km" double precision DEFAULT 15) RETURNS SETOF "public"."contractors"
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "public"."get_nearby_contractors"("p_service_type" "text", "p_latitude" double precision, "p_longitude" double precision, "p_radius_km" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    phone,
    full_name,
    role,
    linked_auth_methods
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.phone, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    ARRAY_REMOVE(
      ARRAY[
        CASE WHEN COALESCE(NEW.email, '') <> '' THEN 'email' END,
        CASE WHEN COALESCE(NEW.phone, '') <> '' THEN 'phone' END
      ],
      NULL
    )::TEXT[]
  );

  IF COALESCE(NEW.raw_user_meta_data->>'role', 'user') = 'contractor' THEN
    INSERT INTO public.contractors (id)
    VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_user"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and lower(coalesce(role, '')) = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_contractor_eligible_for_job"("p_job" "public"."jobs", "p_radius_km" double precision DEFAULT 15) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "public"."is_contractor_eligible_for_job"("p_job" "public"."jobs", "p_radius_km" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."lookup_auth_methods"("p_identifier" "text") RETURNS TABLE("matched_by" "text", "linked_auth_methods" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_identifier TEXT := trim(COALESCE(p_identifier, ''));
  v_phone_plain TEXT;
  v_phone_plus TEXT;
BEGIN
  IF v_identifier = '' THEN
    RETURN;
  END IF;

  IF position('@' IN v_identifier) > 0 THEN
    RETURN QUERY
    SELECT
      'email'::TEXT,
      COALESCE(p.linked_auth_methods, '{}'::TEXT[])
    FROM public.profiles AS p
    WHERE lower(p.email) = lower(v_identifier)
    LIMIT 1;
    RETURN;
  END IF;

  v_phone_plain := ltrim(replace(v_identifier, ' ', ''), '+');
  v_phone_plus := '+' || v_phone_plain;

  RETURN QUERY
  SELECT
    'phone'::TEXT,
    COALESCE(p.linked_auth_methods, '{}'::TEXT[])
  FROM public.profiles AS p
  WHERE p.phone IN (v_phone_plain, v_phone_plus)
  LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."lookup_auth_methods"("p_identifier" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_nearby_contractors"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_nearby_contractors"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_contractor_role_row"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  IF NEW.role = 'contractor' THEN
    INSERT INTO public.contractors (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_contractor_role_row"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_contractor_acceptance_rate"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'broadcast' AND NEW.contractor_id IS NOT NULL THEN
    UPDATE public.contractors
    SET
      total_jobs_accepted = total_jobs_accepted + 1,
      acceptance_rate = (total_jobs_accepted + 1)::NUMERIC / GREATEST(total_jobs_offered, 1)
    WHERE id = NEW.contractor_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_contractor_acceptance_rate"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_contractor_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  UPDATE public.contractors
  SET
    rating = (
      SELECT COALESCE(AVG(r.rating), 0)
      FROM public.reviews r
      WHERE r.reviewee_id = NEW.reviewee_id
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM public.reviews r
      WHERE r.reviewee_id = NEW.reviewee_id
    )
  WHERE id = NEW.reviewee_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_contractor_rating"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_action_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "action_type" "text" NOT NULL,
    "resource_type" "text" NOT NULL,
    "resource_id" "uuid" NOT NULL,
    "reason" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "result" "text" DEFAULT 'success'::"text" NOT NULL,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "admin_action_log_action_type_check" CHECK (("action_type" = ANY (ARRAY['contractor_suspended'::"text", 'contractor_restored'::"text", 'contractor_kyc_approved'::"text", 'contractor_kyc_rejected'::"text", 'job_cancelled'::"text", 'job_status_updated'::"text", 'dispute_created'::"text", 'dispute_resolved'::"text", 'dispute_rejected'::"text", 'support_ticket_created'::"text", 'support_ticket_escalated'::"text", 'support_ticket_resolved'::"text", 'refund_initiated'::"text", 'refund_completed'::"text", 'refund_failed'::"text", 'payout_approved'::"text", 'payout_rejected'::"text", 'payout_processed'::"text", 'settings_category_created'::"text", 'settings_category_updated'::"text", 'settings_category_deleted'::"text", 'settings_service_type_created'::"text", 'settings_service_type_updated'::"text", 'settings_service_type_deleted'::"text", 'settings_urgency_tier_updated'::"text", 'settings_promo_code_created'::"text", 'settings_promo_code_deleted'::"text", 'settings_notification_template_created'::"text", 'settings_notification_template_deleted'::"text", 'settings_notification_campaign_created'::"text", 'settings_notification_campaign_deleted'::"text", 'admin_password_changed'::"text", 'admin_mfa_enabled'::"text", 'admin_mfa_disabled'::"text"]))),
    CONSTRAINT "admin_action_log_resource_type_check" CHECK (("resource_type" = ANY (ARRAY['contractor'::"text", 'contractor_document'::"text", 'job'::"text", 'dispute'::"text", 'support_ticket'::"text", 'payment'::"text", 'withdrawal'::"text", 'payout'::"text", 'service_category'::"text", 'service_type'::"text", 'urgency_tier'::"text", 'promo_code'::"text", 'notification_template'::"text", 'notification_campaign'::"text", 'admin_profile'::"text"]))),
    CONSTRAINT "admin_action_log_result_check" CHECK (("result" = ANY (ARRAY['success'::"text", 'failure'::"text"])))
);


ALTER TABLE "public"."admin_action_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_mfa_recovery_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_user_id" "uuid" NOT NULL,
    "code_hash" "text" NOT NULL,
    "generated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "consumed_at" timestamp with time zone,
    "consumed_by_ip" "inet",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."admin_mfa_recovery_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_security_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_user_id" "uuid" NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "reason" "text" DEFAULT ''::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "admin_security_events_action_check" CHECK (("action" = ANY (ARRAY['mfa_enrolled'::"text", 'mfa_challenged'::"text", 'mfa_verified'::"text", 'recovery_codes_generated'::"text", 'recovery_code_used'::"text", 'mfa_reset_requested'::"text", 'mfa_disabled'::"text", 'password_changed'::"text"])))
);


ALTER TABLE "public"."admin_security_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_security_settings" (
    "admin_user_id" "uuid" NOT NULL,
    "mfa_policy" "text" DEFAULT 'optional'::"text" NOT NULL,
    "recovery_codes_generated_at" timestamp with time zone,
    "last_reauth_at" timestamp with time zone,
    "last_mfa_reset_requested_at" timestamp with time zone,
    "last_mfa_reset_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "admin_security_settings_mfa_policy_check" CHECK (("mfa_policy" = ANY (ARRAY['optional'::"text", 'required'::"text"])))
);


ALTER TABLE "public"."admin_security_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "contractor_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chat_conversations_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."chat_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "body" "text" DEFAULT ''::"text" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "message" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."contact_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contractor_bank_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contractor_id" "uuid" NOT NULL,
    "bank_name" "text" NOT NULL,
    "account_number" "text" NOT NULL,
    "account_name" "text" DEFAULT ''::"text" NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."contractor_bank_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contractor_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contractor_id" "uuid" NOT NULL,
    "document_type" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "file_name" "text" DEFAULT ''::"text" NOT NULL,
    "mime_type" "text" DEFAULT ''::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "contractor_documents_document_type_check" CHECK (("document_type" = ANY (ARRAY['government_id'::"text", 'drivers_licence'::"text", 'passport'::"text", 'national_id'::"text", 'police_check'::"text", 'service_licence'::"text"]))),
    CONSTRAINT "contractor_documents_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."contractor_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dispute_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dispute_id" "uuid" NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "actor_role" "text" NOT NULL,
    "action" "text" NOT NULL,
    "reason" "text" DEFAULT ''::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "dispute_events_action_check" CHECK (("action" = ANY (ARRAY['created'::"text", 'request_evidence'::"text", 'add_evidence'::"text", 'propose_resolution'::"text", 'resolve'::"text", 'reject'::"text", 'escalate'::"text", 'note'::"text"]))),
    CONSTRAINT "dispute_events_actor_role_check" CHECK (("actor_role" = ANY (ARRAY['user'::"text", 'contractor'::"text", 'admin'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."dispute_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dispute_evidence" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dispute_id" "uuid" NOT NULL,
    "submitted_by_id" "uuid" NOT NULL,
    "submitted_by_role" "text" NOT NULL,
    "evidence_type" "text" NOT NULL,
    "url" "text",
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "dispute_evidence_submitted_by_role_check" CHECK (("submitted_by_role" = ANY (ARRAY['user'::"text", 'contractor'::"text", 'admin'::"text"]))),
    CONSTRAINT "dispute_evidence_type_check" CHECK (("evidence_type" = ANY (ARRAY['text'::"text", 'image'::"text", 'file'::"text", 'link'::"text"])))
);


ALTER TABLE "public"."dispute_evidence" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."disputes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "opened_by_id" "uuid" NOT NULL,
    "opened_by_role" "text" NOT NULL,
    "dispute_type" "text" NOT NULL,
    "status" "text" NOT NULL,
    "priority" "text" NOT NULL,
    "reason" "text" DEFAULT ''::"text" NOT NULL,
    "requested_resolution" "text" DEFAULT ''::"text" NOT NULL,
    "assigned_admin_id" "uuid",
    "related_payment_id" "uuid",
    "related_withdrawal_id" "uuid",
    "resolution_type" "text",
    "resolution_amount" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone,
    "rejected_at" timestamp with time zone,
    "refund_status" "text",
    CONSTRAINT "disputes_opened_by_role_check" CHECK (("opened_by_role" = ANY (ARRAY['user'::"text", 'contractor'::"text", 'admin'::"text"]))),
    CONSTRAINT "disputes_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "disputes_refund_status_check" CHECK ((("refund_status" IS NULL) OR ("refund_status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))),
    CONSTRAINT "disputes_resolution_type_check" CHECK ((("resolution_type" IS NULL) OR ("resolution_type" = ANY (ARRAY['no_action'::"text", 'refund'::"text", 'partial_refund'::"text", 'payout_release'::"text", 'payout_block'::"text", 'chargeback'::"text"])))),
    CONSTRAINT "disputes_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'under_review'::"text", 'awaiting_evidence'::"text", 'proposed_resolution'::"text", 'resolved'::"text", 'rejected'::"text", 'escalated'::"text"]))),
    CONSTRAINT "disputes_type_check" CHECK (("dispute_type" = ANY (ARRAY['service_quality'::"text", 'payment'::"text", 'behavior'::"text", 'safety'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."disputes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."finance_admin_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "target_type" "text" NOT NULL,
    "payment_id" "uuid",
    "withdrawal_id" "uuid",
    "action" "text" NOT NULL,
    "reason" "text" DEFAULT ''::"text" NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "finance_admin_events_action_check" CHECK (("action" = ANY (ARRAY['approve_payout'::"text", 'reject_payout'::"text", 'flag_for_review'::"text", 'mark_reconciled'::"text", 'request_reversal'::"text"]))),
    CONSTRAINT "finance_admin_events_target_fk_check" CHECK (((("target_type" = 'payment'::"text") AND ("payment_id" IS NOT NULL) AND ("withdrawal_id" IS NULL)) OR (("target_type" = 'withdrawal'::"text") AND ("withdrawal_id" IS NOT NULL) AND ("payment_id" IS NULL)))),
    CONSTRAINT "finance_admin_events_target_type_check" CHECK (("target_type" = ANY (ARRAY['payment'::"text", 'withdrawal'::"text"])))
);


ALTER TABLE "public"."finance_admin_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."finance_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "dispute_id" "uuid",
    "payment_id" "uuid",
    "amount" numeric(10,2),
    "reason" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "finance_audit_log_action_check" CHECK (("action" = ANY (ARRAY['refund_initiated'::"text", 'refund_completed'::"text", 'refund_failed'::"text", 'reversal_initiated'::"text", 'chargeback_initiated'::"text"])))
);


ALTER TABLE "public"."finance_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "file_name" "text" DEFAULT ''::"text" NOT NULL,
    "mime_type" "text" DEFAULT ''::"text" NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."job_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_declined_contractors" (
    "job_id" "uuid" NOT NULL,
    "contractor_id" "uuid" NOT NULL,
    "declined_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."job_declined_contractors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_operations_log" (
    "id" "uuid" NOT NULL,
    "job_id" "uuid" NOT NULL,
    "operation_type" "text" NOT NULL,
    "reason" "text",
    "actor_id" "uuid" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."job_operations_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "channel" "text" NOT NULL,
    "template_id" "uuid",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "audience_type" "text" DEFAULT 'admins'::"text" NOT NULL,
    "audience_filter" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "schedule_type" "text" DEFAULT 'manual'::"text" NOT NULL,
    "scheduled_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by_admin_id" "uuid",
    "updated_by_admin_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "notification_campaigns_audience_type_check" CHECK (("audience_type" = ANY (ARRAY['admins'::"text", 'users'::"text", 'contractors'::"text", 'segment'::"text"]))),
    CONSTRAINT "notification_campaigns_channel_check" CHECK (("channel" = ANY (ARRAY['push'::"text", 'email'::"text", 'sms'::"text"]))),
    CONSTRAINT "notification_campaigns_schedule_type_check" CHECK (("schedule_type" = ANY (ARRAY['manual'::"text", 'immediate'::"text", 'scheduled'::"text"]))),
    CONSTRAINT "notification_campaigns_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'enabled'::"text", 'disabled'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."notification_campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_deliveries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid",
    "template_id" "uuid",
    "recipient_id" "uuid",
    "recipient_role" "text",
    "channel" "text" NOT NULL,
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "provider_message_id" "text",
    "provider_error" "text",
    "queued_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sent_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "failed_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "notification_deliveries_channel_check" CHECK (("channel" = ANY (ARRAY['push'::"text", 'email'::"text", 'sms'::"text"]))),
    CONSTRAINT "notification_deliveries_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'sending'::"text", 'sent'::"text", 'delivered'::"text", 'failed'::"text", 'canceled'::"text"])))
);


ALTER TABLE "public"."notification_deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "channel" "text" NOT NULL,
    "title_template" "text",
    "body_template" "text" DEFAULT ''::"text" NOT NULL,
    "payload_template" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by_admin_id" "uuid",
    "updated_by_admin_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "notification_templates_channel_check" CHECK (("channel" = ANY (ARRAY['push'::"text", 'email'::"text", 'sms'::"text"])))
);


ALTER TABLE "public"."notification_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "body" "text" DEFAULT ''::"text" NOT NULL,
    "type" "text" DEFAULT 'message'::"text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['job_request'::"text", 'job_accepted'::"text", 'job_status'::"text", 'contractor_arrived'::"text", 'payment'::"text", 'message'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "payer_id" "uuid" NOT NULL,
    "payee_id" "uuid",
    "amount" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "platform_fee" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "contractor_payout" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "stripe_payment_intent_id" "text",
    "stripe_transfer_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "currency" "text" DEFAULT 'cad'::"text" NOT NULL,
    "capture_method" "text" DEFAULT 'manual'::"text" NOT NULL,
    "stripe_charge_id" "text",
    "stripe_application_fee_amount" integer,
    "captured_at" timestamp with time zone,
    "refunded_at" timestamp with time zone,
    "refund_initiated_by" "uuid",
    "refund_reason" "text",
    CONSTRAINT "payments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'requires_payment_method'::"text", 'processing'::"text", 'authorized'::"text", 'paid'::"text", 'captured'::"text", 'failed'::"text", 'refunded'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."platform_config" (
    "key" "text" NOT NULL,
    "value" "text" DEFAULT ''::"text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."platform_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" DEFAULT ''::"text" NOT NULL,
    "phone" "text" DEFAULT ''::"text" NOT NULL,
    "full_name" "text" DEFAULT ''::"text" NOT NULL,
    "first_name" "text" DEFAULT ''::"text" NOT NULL,
    "last_name" "text" DEFAULT ''::"text" NOT NULL,
    "gender" "text",
    "avatar_url" "text",
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "fcm_token" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "linked_auth_methods" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "stripe_customer_id" "text",
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'contractor'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promo_code_redemptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "promo_code_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "job_id" "uuid",
    "payment_id" "uuid",
    "discount_applied" numeric,
    "currency" "text",
    "redeemed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."promo_code_redemptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promo_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "discount_type" "text" NOT NULL,
    "discount_value" numeric NOT NULL,
    "discount_currency" "text",
    "starts_on" "date",
    "ends_on" "date",
    "is_active" boolean DEFAULT true NOT NULL,
    "max_redemptions_total" integer,
    "max_redemptions_per_user" integer,
    "min_job_amount" numeric,
    "created_by_admin_id" "uuid",
    "updated_by_admin_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "promo_codes_amount_currency_check" CHECK ((("discount_type" <> 'amount'::"text") OR ("discount_currency" IS NOT NULL))),
    CONSTRAINT "promo_codes_date_range_check" CHECK ((("starts_on" IS NULL) OR ("ends_on" IS NULL) OR ("ends_on" >= "starts_on"))),
    CONSTRAINT "promo_codes_discount_type_check" CHECK (("discount_type" = ANY (ARRAY['percent'::"text", 'amount'::"text"]))),
    CONSTRAINT "promo_codes_discount_value_check" CHECK (("discount_value" > (0)::numeric))
);


ALTER TABLE "public"."promo_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "reviewee_id" "uuid" NOT NULL,
    "rating" numeric(2,1) NOT NULL,
    "comment" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= (1)::numeric) AND ("rating" <= (5)::numeric)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "icon_key" "text" DEFAULT ''::"text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "min_hours" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."service_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "base_price" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "is_price_additional" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "min_hours" integer DEFAULT 1 NOT NULL
);


ALTER TABLE "public"."service_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_ticket_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "actor_role" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "message" "text" DEFAULT ''::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "support_ticket_events_actor_role_check" CHECK (("actor_role" = ANY (ARRAY['user'::"text", 'contractor'::"text", 'admin'::"text", 'system'::"text"]))),
    CONSTRAINT "support_ticket_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['created'::"text", 'assigned'::"text", 'status_changed'::"text", 'message'::"text", 'note'::"text", 'resolved'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."support_ticket_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_ticket_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "sender_role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "read_by_admins" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "support_ticket_messages_content_not_empty" CHECK (("length"(TRIM(BOTH FROM "content")) > 0)),
    CONSTRAINT "support_ticket_messages_sender_role_check" CHECK (("sender_role" = ANY (ARRAY['admin'::"text", 'user'::"text", 'contractor'::"text"])))
);


ALTER TABLE "public"."support_ticket_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "requester_id" "uuid" NOT NULL,
    "requester_role" "text" NOT NULL,
    "job_id" "uuid",
    "subject" "text" NOT NULL,
    "description" "text" NOT NULL,
    "status" "text" NOT NULL,
    "priority" "text" NOT NULL,
    "assigned_admin_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone,
    "closed_at" timestamp with time zone,
    CONSTRAINT "support_tickets_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "support_tickets_requester_role_check" CHECK (("requester_role" = ANY (ARRAY['user'::"text", 'contractor'::"text", 'admin'::"text"]))),
    CONSTRAINT "support_tickets_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_review'::"text", 'awaiting_requester'::"text", 'awaiting_contractor'::"text", 'resolved'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."urgency_tiers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "label" "text" DEFAULT ''::"text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "extra_fee" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "contractor_share_percent" numeric(5,2) DEFAULT 70.00 NOT NULL,
    "platform_share_percent" numeric(5,2) DEFAULT 30.00 NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."urgency_tiers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."withdrawals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contractor_id" "uuid" NOT NULL,
    "bank_account_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reference" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processed_at" timestamp with time zone,
    "stripe_payout_id" "text",
    "failure_code" "text",
    "failure_message" "text",
    "currency" "text" DEFAULT 'cad'::"text" NOT NULL,
    CONSTRAINT "withdrawals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."withdrawals" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_action_log"
    ADD CONSTRAINT "admin_action_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_mfa_recovery_codes"
    ADD CONSTRAINT "admin_mfa_recovery_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_mfa_recovery_codes"
    ADD CONSTRAINT "admin_mfa_recovery_codes_unique_hash" UNIQUE ("admin_user_id", "code_hash");



ALTER TABLE ONLY "public"."admin_security_events"
    ADD CONSTRAINT "admin_security_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_security_settings"
    ADD CONSTRAINT "admin_security_settings_pkey" PRIMARY KEY ("admin_user_id");



ALTER TABLE ONLY "public"."chat_conversations"
    ADD CONSTRAINT "chat_conversations_job_id_key" UNIQUE ("job_id");



ALTER TABLE ONLY "public"."chat_conversations"
    ADD CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_feedback"
    ADD CONSTRAINT "contact_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contractor_bank_accounts"
    ADD CONSTRAINT "contractor_bank_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contractor_documents"
    ADD CONSTRAINT "contractor_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contractors"
    ADD CONSTRAINT "contractors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dispute_events"
    ADD CONSTRAINT "dispute_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dispute_evidence"
    ADD CONSTRAINT "dispute_evidence_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."finance_admin_events"
    ADD CONSTRAINT "finance_admin_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."finance_audit_log"
    ADD CONSTRAINT "finance_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_attachments"
    ADD CONSTRAINT "job_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_declined_contractors"
    ADD CONSTRAINT "job_declined_contractors_pkey" PRIMARY KEY ("job_id", "contractor_id");



ALTER TABLE ONLY "public"."job_operations_log"
    ADD CONSTRAINT "job_operations_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_campaigns"
    ADD CONSTRAINT "notification_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_deliveries"
    ADD CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_config"
    ADD CONSTRAINT "platform_config_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promo_code_redemptions"
    ADD CONSTRAINT "promo_code_redemptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_code_unique" UNIQUE ("code");



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_job_id_reviewer_id_key" UNIQUE ("job_id", "reviewer_id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_categories"
    ADD CONSTRAINT "service_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."service_categories"
    ADD CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_types"
    ADD CONSTRAINT "service_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_ticket_events"
    ADD CONSTRAINT "support_ticket_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_ticket_messages"
    ADD CONSTRAINT "support_ticket_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."urgency_tiers"
    ADD CONSTRAINT "urgency_tiers_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."urgency_tiers"
    ADD CONSTRAINT "urgency_tiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."withdrawals"
    ADD CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id");



CREATE INDEX "admin_mfa_recovery_codes_admin_user_id_idx" ON "public"."admin_mfa_recovery_codes" USING "btree" ("admin_user_id");



CREATE INDEX "admin_mfa_recovery_codes_available_idx" ON "public"."admin_mfa_recovery_codes" USING "btree" ("admin_user_id", "consumed_at");



CREATE INDEX "admin_security_events_actor_id_created_at_idx" ON "public"."admin_security_events" USING "btree" ("actor_id", "created_at" DESC);



CREATE INDEX "admin_security_events_admin_user_id_created_at_idx" ON "public"."admin_security_events" USING "btree" ("admin_user_id", "created_at" DESC);



CREATE INDEX "dispute_events_created_at_idx" ON "public"."dispute_events" USING "btree" ("created_at" DESC);



CREATE INDEX "dispute_events_dispute_id_idx" ON "public"."dispute_events" USING "btree" ("dispute_id", "created_at" DESC);



CREATE INDEX "dispute_evidence_dispute_id_idx" ON "public"."dispute_evidence" USING "btree" ("dispute_id", "created_at" DESC);



CREATE INDEX "disputes_assigned_admin_id_idx" ON "public"."disputes" USING "btree" ("assigned_admin_id");



CREATE INDEX "disputes_created_at_idx" ON "public"."disputes" USING "btree" ("created_at" DESC);



CREATE INDEX "disputes_job_id_idx" ON "public"."disputes" USING "btree" ("job_id");



CREATE INDEX "disputes_status_idx" ON "public"."disputes" USING "btree" ("status");



CREATE INDEX "finance_admin_events_actor_id_idx" ON "public"."finance_admin_events" USING "btree" ("actor_id");



CREATE INDEX "finance_admin_events_created_at_idx" ON "public"."finance_admin_events" USING "btree" ("created_at" DESC);



CREATE INDEX "finance_admin_events_payment_id_idx" ON "public"."finance_admin_events" USING "btree" ("payment_id");



CREATE INDEX "finance_admin_events_withdrawal_id_idx" ON "public"."finance_admin_events" USING "btree" ("withdrawal_id");



CREATE INDEX "idx_admin_action_log_action_type" ON "public"."admin_action_log" USING "btree" ("action_type");



CREATE INDEX "idx_admin_action_log_admin_created" ON "public"."admin_action_log" USING "btree" ("admin_id", "created_at" DESC);



CREATE INDEX "idx_admin_action_log_admin_id" ON "public"."admin_action_log" USING "btree" ("admin_id");



CREATE INDEX "idx_admin_action_log_created_at" ON "public"."admin_action_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_admin_action_log_resource_id" ON "public"."admin_action_log" USING "btree" ("resource_id");



CREATE INDEX "idx_admin_action_log_resource_type" ON "public"."admin_action_log" USING "btree" ("resource_type");



CREATE INDEX "idx_admin_action_log_result" ON "public"."admin_action_log" USING "btree" ("result");



CREATE INDEX "idx_chat_conversations_job" ON "public"."chat_conversations" USING "btree" ("job_id");



CREATE INDEX "idx_chat_messages_conversation" ON "public"."chat_messages" USING "btree" ("conversation_id", "created_at");



CREATE INDEX "idx_contact_feedback_created_at" ON "public"."contact_feedback" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_contact_feedback_email" ON "public"."contact_feedback" USING "btree" ("email");



CREATE INDEX "idx_contractor_bank_accounts_contractor" ON "public"."contractor_bank_accounts" USING "btree" ("contractor_id");



CREATE INDEX "idx_contractor_documents_contractor" ON "public"."contractor_documents" USING "btree" ("contractor_id");



CREATE INDEX "idx_contractors_available" ON "public"."contractors" USING "btree" ("availability_status") WHERE ("availability_status" = 'online'::"text");



CREATE INDEX "idx_contractors_stripe_account" ON "public"."contractors" USING "btree" ("stripe_account_id") WHERE ("stripe_account_id" IS NOT NULL);



CREATE INDEX "idx_disputes_refund_status" ON "public"."disputes" USING "btree" ("refund_status") WHERE ("refund_status" IS NOT NULL);



CREATE INDEX "idx_disputes_related_payment_id" ON "public"."disputes" USING "btree" ("related_payment_id") WHERE ("related_payment_id" IS NOT NULL);



CREATE INDEX "idx_finance_audit_log_action" ON "public"."finance_audit_log" USING "btree" ("action");



CREATE INDEX "idx_finance_audit_log_admin" ON "public"."finance_audit_log" USING "btree" ("admin_id");



CREATE INDEX "idx_finance_audit_log_created" ON "public"."finance_audit_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_finance_audit_log_dispute" ON "public"."finance_audit_log" USING "btree" ("dispute_id") WHERE ("dispute_id" IS NOT NULL);



CREATE INDEX "idx_finance_audit_log_payment" ON "public"."finance_audit_log" USING "btree" ("payment_id") WHERE ("payment_id" IS NOT NULL);



CREATE INDEX "idx_job_operations_by_job_id" ON "public"."job_operations_log" USING "btree" ("job_id");



CREATE INDEX "idx_job_operations_by_type" ON "public"."job_operations_log" USING "btree" ("operation_type");



CREATE INDEX "idx_jobs_broadcast" ON "public"."jobs" USING "btree" ("status") WHERE ("status" = 'broadcast'::"text");



CREATE INDEX "idx_jobs_contractor_id" ON "public"."jobs" USING "btree" ("contractor_id");



CREATE INDEX "idx_jobs_status" ON "public"."jobs" USING "btree" ("status");



CREATE INDEX "idx_jobs_user_id" ON "public"."jobs" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_recipient" ON "public"."notifications" USING "btree" ("recipient_id", "created_at" DESC);



CREATE INDEX "idx_notifications_unread" ON "public"."notifications" USING "btree" ("recipient_id") WHERE ("read_at" IS NULL);



CREATE INDEX "idx_payments_job" ON "public"."payments" USING "btree" ("job_id");



CREATE INDEX "idx_payments_payee" ON "public"."payments" USING "btree" ("payee_id");



CREATE INDEX "idx_payments_refund_initiated_by" ON "public"."payments" USING "btree" ("refund_initiated_by") WHERE ("refund_initiated_by" IS NOT NULL);



CREATE INDEX "idx_payments_stripe_charge" ON "public"."payments" USING "btree" ("stripe_charge_id") WHERE ("stripe_charge_id" IS NOT NULL);



CREATE INDEX "idx_payments_stripe_intent" ON "public"."payments" USING "btree" ("stripe_payment_intent_id") WHERE ("stripe_payment_intent_id" IS NOT NULL);



CREATE INDEX "idx_profiles_email_lower" ON "public"."profiles" USING "btree" ("lower"("email"));



CREATE INDEX "idx_profiles_phone" ON "public"."profiles" USING "btree" ("phone");



CREATE INDEX "idx_profiles_stripe_customer" ON "public"."profiles" USING "btree" ("stripe_customer_id") WHERE ("stripe_customer_id" IS NOT NULL);



CREATE INDEX "idx_reviews_reviewee" ON "public"."reviews" USING "btree" ("reviewee_id");



CREATE INDEX "idx_service_types_category" ON "public"."service_types" USING "btree" ("category_id");



CREATE INDEX "idx_withdrawals_stripe_payout" ON "public"."withdrawals" USING "btree" ("stripe_payout_id") WHERE ("stripe_payout_id" IS NOT NULL);



CREATE UNIQUE INDEX "notification_campaigns_name_unique_idx" ON "public"."notification_campaigns" USING "btree" ("lower"("name"));



CREATE INDEX "notification_campaigns_status_idx" ON "public"."notification_campaigns" USING "btree" ("status", "updated_at" DESC);



CREATE INDEX "notification_deliveries_campaign_id_idx" ON "public"."notification_deliveries" USING "btree" ("campaign_id", "queued_at" DESC);



CREATE INDEX "notification_deliveries_recipient_id_idx" ON "public"."notification_deliveries" USING "btree" ("recipient_id", "queued_at" DESC);



CREATE UNIQUE INDEX "notification_templates_name_unique_idx" ON "public"."notification_templates" USING "btree" ("lower"("name"));



CREATE INDEX "promo_code_redemptions_promo_code_id_idx" ON "public"."promo_code_redemptions" USING "btree" ("promo_code_id", "redeemed_at" DESC);



CREATE INDEX "promo_code_redemptions_user_id_idx" ON "public"."promo_code_redemptions" USING "btree" ("user_id", "redeemed_at" DESC);



CREATE INDEX "support_ticket_events_created_at_idx" ON "public"."support_ticket_events" USING "btree" ("created_at" DESC);



CREATE INDEX "support_ticket_events_ticket_id_idx" ON "public"."support_ticket_events" USING "btree" ("ticket_id", "created_at" DESC);



CREATE INDEX "support_ticket_messages_sender_id_idx" ON "public"."support_ticket_messages" USING "btree" ("sender_id");



CREATE INDEX "support_ticket_messages_ticket_id_idx" ON "public"."support_ticket_messages" USING "btree" ("ticket_id", "created_at");



CREATE INDEX "support_tickets_created_at_idx" ON "public"."support_tickets" USING "btree" ("created_at" DESC);



CREATE INDEX "support_tickets_job_id_idx" ON "public"."support_tickets" USING "btree" ("job_id");



CREATE INDEX "support_tickets_requester_id_idx" ON "public"."support_tickets" USING "btree" ("requester_id");



CREATE INDEX "support_tickets_status_idx" ON "public"."support_tickets" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "on_contractor_verification_update" BEFORE UPDATE ON "public"."contractors" FOR EACH ROW EXECUTE FUNCTION "public"."check_contractor_verification"();



CREATE OR REPLACE TRIGGER "on_job_broadcast_notify_contractors" AFTER INSERT OR UPDATE OF "status" ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."notify_nearby_contractors"();



CREATE OR REPLACE TRIGGER "on_job_completed_close_chat" AFTER UPDATE OF "status" ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."close_conversation_on_job_complete"();



CREATE OR REPLACE TRIGGER "on_job_status_changed" AFTER UPDATE OF "status" ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_contractor_acceptance_rate"();



CREATE OR REPLACE TRIGGER "on_profile_role_sync_contractor" AFTER INSERT OR UPDATE OF "role" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_contractor_role_row"();



CREATE OR REPLACE TRIGGER "on_review_created" AFTER INSERT ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_contractor_rating"();



CREATE OR REPLACE TRIGGER "set_admin_security_settings_updated_at" BEFORE UPDATE ON "public"."admin_security_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_chat_conversations_updated_at" BEFORE UPDATE ON "public"."chat_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_contractors_updated_at" BEFORE UPDATE ON "public"."contractors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_jobs_updated_at" BEFORE UPDATE ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_notification_campaigns_updated_at" BEFORE UPDATE ON "public"."notification_campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_notification_templates_updated_at" BEFORE UPDATE ON "public"."notification_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_payments_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_promo_codes_updated_at" BEFORE UPDATE ON "public"."promo_codes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."admin_action_log"
    ADD CONSTRAINT "admin_action_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."admin_mfa_recovery_codes"
    ADD CONSTRAINT "admin_mfa_recovery_codes_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_security_events"
    ADD CONSTRAINT "admin_security_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."admin_security_events"
    ADD CONSTRAINT "admin_security_events_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_security_settings"
    ADD CONSTRAINT "admin_security_settings_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_security_settings"
    ADD CONSTRAINT "admin_security_settings_last_mfa_reset_by_fkey" FOREIGN KEY ("last_mfa_reset_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."chat_conversations"
    ADD CONSTRAINT "chat_conversations_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."chat_conversations"
    ADD CONSTRAINT "chat_conversations_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_conversations"
    ADD CONSTRAINT "chat_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."contractor_bank_accounts"
    ADD CONSTRAINT "contractor_bank_accounts_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "public"."contractors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contractor_documents"
    ADD CONSTRAINT "contractor_documents_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "public"."contractors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contractor_documents"
    ADD CONSTRAINT "contractor_documents_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."contractors"
    ADD CONSTRAINT "contractors_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contractors"
    ADD CONSTRAINT "contractors_restored_by_fkey" FOREIGN KEY ("restored_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."contractors"
    ADD CONSTRAINT "contractors_suspended_by_fkey" FOREIGN KEY ("suspended_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."dispute_events"
    ADD CONSTRAINT "dispute_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."dispute_events"
    ADD CONSTRAINT "dispute_events_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "public"."disputes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dispute_evidence"
    ADD CONSTRAINT "dispute_evidence_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "public"."disputes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dispute_evidence"
    ADD CONSTRAINT "dispute_evidence_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_assigned_admin_id_fkey" FOREIGN KEY ("assigned_admin_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_opened_by_id_fkey" FOREIGN KEY ("opened_by_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_related_payment_id_fkey" FOREIGN KEY ("related_payment_id") REFERENCES "public"."payments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_related_withdrawal_id_fkey" FOREIGN KEY ("related_withdrawal_id") REFERENCES "public"."withdrawals"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."finance_admin_events"
    ADD CONSTRAINT "finance_admin_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."finance_admin_events"
    ADD CONSTRAINT "finance_admin_events_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."finance_admin_events"
    ADD CONSTRAINT "finance_admin_events_withdrawal_id_fkey" FOREIGN KEY ("withdrawal_id") REFERENCES "public"."withdrawals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."finance_audit_log"
    ADD CONSTRAINT "finance_audit_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."finance_audit_log"
    ADD CONSTRAINT "finance_audit_log_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "public"."disputes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."finance_audit_log"
    ADD CONSTRAINT "finance_audit_log_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."job_attachments"
    ADD CONSTRAINT "job_attachments_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_attachments"
    ADD CONSTRAINT "job_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."job_declined_contractors"
    ADD CONSTRAINT "job_declined_contractors_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."job_declined_contractors"
    ADD CONSTRAINT "job_declined_contractors_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_operations_log"
    ADD CONSTRAINT "job_operations_log_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_service_category_id_fkey" FOREIGN KEY ("service_category_id") REFERENCES "public"."service_categories"("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."notification_campaigns"
    ADD CONSTRAINT "notification_campaigns_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."notification_campaigns"
    ADD CONSTRAINT "notification_campaigns_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notification_campaigns"
    ADD CONSTRAINT "notification_campaigns_updated_by_admin_id_fkey" FOREIGN KEY ("updated_by_admin_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."notification_deliveries"
    ADD CONSTRAINT "notification_deliveries_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."notification_campaigns"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notification_deliveries"
    ADD CONSTRAINT "notification_deliveries_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notification_deliveries"
    ADD CONSTRAINT "notification_deliveries_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_updated_by_admin_id_fkey" FOREIGN KEY ("updated_by_admin_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_payee_id_fkey" FOREIGN KEY ("payee_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_refund_initiated_by_fkey" FOREIGN KEY ("refund_initiated_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promo_code_redemptions"
    ADD CONSTRAINT "promo_code_redemptions_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promo_code_redemptions"
    ADD CONSTRAINT "promo_code_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_updated_by_admin_id_fkey" FOREIGN KEY ("updated_by_admin_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewee_id_fkey" FOREIGN KEY ("reviewee_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."service_types"
    ADD CONSTRAINT "service_types_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_ticket_events"
    ADD CONSTRAINT "support_ticket_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."support_ticket_events"
    ADD CONSTRAINT "support_ticket_events_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_ticket_messages"
    ADD CONSTRAINT "support_ticket_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."support_ticket_messages"
    ADD CONSTRAINT "support_ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_assigned_admin_id_fkey" FOREIGN KEY ("assigned_admin_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."withdrawals"
    ADD CONSTRAINT "withdrawals_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "public"."contractor_bank_accounts"("id");



ALTER TABLE ONLY "public"."withdrawals"
    ADD CONSTRAINT "withdrawals_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "public"."contractors"("id");



CREATE POLICY "Admins can delete notification campaigns" ON "public"."notification_campaigns" FOR DELETE TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can delete notification templates" ON "public"."notification_templates" FOR DELETE TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can delete own MFA recovery codes" ON "public"."admin_mfa_recovery_codes" FOR DELETE TO "authenticated" USING (("public"."is_admin_user"() AND ("auth"."uid"() = "admin_user_id")));



CREATE POLICY "Admins can delete promo codes" ON "public"."promo_codes" FOR DELETE TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can insert dispute events" ON "public"."dispute_events" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can insert dispute evidence" ON "public"."dispute_evidence" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can insert disputes" ON "public"."disputes" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can insert finance admin events" ON "public"."finance_admin_events" FOR INSERT WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can insert finance audit logs" ON "public"."finance_audit_log" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin_user"() AND ("admin_id" = "auth"."uid"())));



CREATE POLICY "Admins can insert job operations" ON "public"."job_operations_log" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin_user"() AND ("actor_id" = "auth"."uid"())));



CREATE POLICY "Admins can insert notification campaigns" ON "public"."notification_campaigns" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can insert notification deliveries" ON "public"."notification_deliveries" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can insert notification templates" ON "public"."notification_templates" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can insert own MFA recovery codes" ON "public"."admin_mfa_recovery_codes" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin_user"() AND ("auth"."uid"() = "admin_user_id")));



CREATE POLICY "Admins can insert own security events" ON "public"."admin_security_events" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin_user"() AND ("auth"."uid"() = "actor_id") AND ("auth"."uid"() = "admin_user_id")));



CREATE POLICY "Admins can insert own security settings" ON "public"."admin_security_settings" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin_user"() AND ("auth"."uid"() = "admin_user_id")));



CREATE POLICY "Admins can insert platform config" ON "public"."platform_config" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can insert promo code redemptions" ON "public"."promo_code_redemptions" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can insert promo codes" ON "public"."promo_codes" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can insert service categories" ON "public"."service_categories" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can insert service types" ON "public"."service_types" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can insert support ticket events" ON "public"."support_ticket_events" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can insert support tickets" ON "public"."support_tickets" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can insert urgency tiers" ON "public"."urgency_tiers" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can read contact feedback" ON "public"."contact_feedback" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can read job operations logs" ON "public"."job_operations_log" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can review contractor documents" ON "public"."contractor_documents" FOR UPDATE TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can update contractors" ON "public"."contractors" FOR UPDATE TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can update dispute events" ON "public"."dispute_events" FOR UPDATE TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can update dispute evidence" ON "public"."dispute_evidence" FOR UPDATE TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can update disputes" ON "public"."disputes" FOR UPDATE TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can update jobs" ON "public"."jobs" FOR UPDATE TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can update notification campaigns" ON "public"."notification_campaigns" FOR UPDATE TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can update notification deliveries" ON "public"."notification_deliveries" FOR UPDATE TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can update notification templates" ON "public"."notification_templates" FOR UPDATE TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can update own MFA recovery codes" ON "public"."admin_mfa_recovery_codes" FOR UPDATE TO "authenticated" USING (("public"."is_admin_user"() AND ("auth"."uid"() = "admin_user_id"))) WITH CHECK (("public"."is_admin_user"() AND ("auth"."uid"() = "admin_user_id")));



CREATE POLICY "Admins can update own security settings" ON "public"."admin_security_settings" FOR UPDATE TO "authenticated" USING (("public"."is_admin_user"() AND ("auth"."uid"() = "admin_user_id"))) WITH CHECK (("public"."is_admin_user"() AND ("auth"."uid"() = "admin_user_id")));



CREATE POLICY "Admins can update platform config" ON "public"."platform_config" FOR UPDATE TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can update profiles" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'admin'::"text"))))) WITH CHECK (true);



CREATE POLICY "Admins can update promo code redemptions" ON "public"."promo_code_redemptions" FOR UPDATE TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can update promo codes" ON "public"."promo_codes" FOR UPDATE TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can update refund fields on payments" ON "public"."payments" FOR UPDATE USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can update refund status on disputes" ON "public"."disputes" FOR UPDATE USING (("public"."is_admin_user"() AND ("resolution_type" = ANY (ARRAY['refund'::"text", 'partial_refund'::"text"])))) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can update service categories" ON "public"."service_categories" FOR UPDATE TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can update service types" ON "public"."service_types" FOR UPDATE TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can update support ticket events" ON "public"."support_ticket_events" FOR UPDATE TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can update support tickets" ON "public"."support_tickets" FOR UPDATE TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can update urgency tiers" ON "public"."urgency_tiers" FOR UPDATE TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can view contractor bank accounts" ON "public"."contractor_bank_accounts" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can view contractor documents" ON "public"."contractor_documents" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can view dispute events" ON "public"."dispute_events" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can view dispute evidence" ON "public"."dispute_evidence" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can view disputes" ON "public"."disputes" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can view finance admin events" ON "public"."finance_admin_events" FOR SELECT USING ("public"."is_admin_user"());



CREATE POLICY "Admins can view finance audit log" ON "public"."finance_audit_log" FOR SELECT USING ("public"."is_admin_user"());



CREATE POLICY "Admins can view jobs" ON "public"."jobs" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can view notification campaigns" ON "public"."notification_campaigns" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can view notification deliveries" ON "public"."notification_deliveries" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can view notification templates" ON "public"."notification_templates" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can view notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can view own MFA recovery codes" ON "public"."admin_mfa_recovery_codes" FOR SELECT TO "authenticated" USING (("public"."is_admin_user"() AND ("auth"."uid"() = "admin_user_id")));



CREATE POLICY "Admins can view own security events" ON "public"."admin_security_events" FOR SELECT TO "authenticated" USING (("public"."is_admin_user"() AND (("auth"."uid"() = "admin_user_id") OR ("auth"."uid"() = "actor_id"))));



CREATE POLICY "Admins can view own security settings" ON "public"."admin_security_settings" FOR SELECT TO "authenticated" USING (("public"."is_admin_user"() AND ("auth"."uid"() = "admin_user_id")));



CREATE POLICY "Admins can view payments" ON "public"."payments" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can view promo code redemptions" ON "public"."promo_code_redemptions" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can view promo codes" ON "public"."promo_codes" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can view support ticket events" ON "public"."support_ticket_events" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can view support tickets" ON "public"."support_tickets" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can view withdrawals" ON "public"."withdrawals" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Anyone can insert contact feedback" ON "public"."contact_feedback" FOR INSERT TO "anon", "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can create jobs" ON "public"."jobs" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Chat participants can send messages" ON "public"."chat_messages" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "sender_id") AND ("conversation_id" IN ( SELECT "chat_conversations"."id"
   FROM "public"."chat_conversations"
  WHERE (("chat_conversations"."user_id" = "auth"."uid"()) OR ("chat_conversations"."contractor_id" = "auth"."uid"()))))));



CREATE POLICY "Chat participants can view conversations" ON "public"."chat_conversations" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "contractor_id")));



CREATE POLICY "Chat participants can view messages" ON "public"."chat_messages" FOR SELECT TO "authenticated" USING (("conversation_id" IN ( SELECT "chat_conversations"."id"
   FROM "public"."chat_conversations"
  WHERE (("chat_conversations"."user_id" = "auth"."uid"()) OR ("chat_conversations"."contractor_id" = "auth"."uid"())))));



CREATE POLICY "Contractors can add bank accounts" ON "public"."contractor_bank_accounts" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "contractor_id"));



CREATE POLICY "Contractors can decline jobs" ON "public"."job_declined_contractors" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "contractor_id"));



CREATE POLICY "Contractors can delete own bank accounts" ON "public"."contractor_bank_accounts" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "contractor_id"));



CREATE POLICY "Contractors can request withdrawals" ON "public"."withdrawals" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "contractor_id"));



CREATE POLICY "Contractors can update own bank accounts" ON "public"."contractor_bank_accounts" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "contractor_id"));



CREATE POLICY "Contractors can update own record" ON "public"."contractors" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Contractors can upload documents" ON "public"."contractor_documents" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "contractor_id"));



CREATE POLICY "Contractors can view available and assigned jobs" ON "public"."jobs" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "contractor_id") OR (("status" = 'broadcast'::"text") AND "public"."is_contractor_eligible_for_job"("jobs".*, (15)::double precision))));



CREATE POLICY "Contractors see own bank accounts" ON "public"."contractor_bank_accounts" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "contractor_id"));



CREATE POLICY "Contractors see own documents" ON "public"."contractor_documents" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "contractor_id"));



CREATE POLICY "Contractors see own withdrawals" ON "public"."withdrawals" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "contractor_id"));



CREATE POLICY "Contractors viewable by authenticated users" ON "public"."contractors" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Declined visible to job owner and contractor" ON "public"."job_declined_contractors" FOR SELECT TO "authenticated" USING ((("contractor_id" = "auth"."uid"()) OR ("job_id" IN ( SELECT "jobs"."id"
   FROM "public"."jobs"
  WHERE ("jobs"."user_id" = "auth"."uid"())))));



CREATE POLICY "Finance admin can cancel payments" ON "public"."payments" FOR UPDATE WITH CHECK (("public"."is_admin_user"() AND ("status" = ANY (ARRAY['pending'::"text", 'requires_payment_method'::"text"])) AND ("auth"."uid"() <> "gen_random_uuid"())));



CREATE POLICY "Finance admin can manage withdrawals" ON "public"."withdrawals" FOR UPDATE WITH CHECK (("public"."is_admin_user"() AND ("status" = ANY (ARRAY['pending'::"text", 'processing'::"text"])) AND ("auth"."uid"() <> "gen_random_uuid"())));



CREATE POLICY "Finance admin can mark payment failed" ON "public"."payments" FOR UPDATE WITH CHECK (("public"."is_admin_user"() AND ("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'authorized'::"text", 'captured'::"text", 'paid'::"text"])) AND ("auth"."uid"() <> "gen_random_uuid"())));



CREATE POLICY "Finance admin can refund payments" ON "public"."payments" FOR UPDATE WITH CHECK (("public"."is_admin_user"() AND ("status" = ANY (ARRAY['captured'::"text", 'paid'::"text"])) AND ("auth"."uid"() <> "gen_random_uuid"())));



CREATE POLICY "Job owner can upload attachments" ON "public"."job_attachments" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "uploaded_by"));



CREATE POLICY "Job participants can update jobs" ON "public"."jobs" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "contractor_id"))) WITH CHECK ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "contractor_id")));



CREATE POLICY "Job participants can view attachments" ON "public"."job_attachments" FOR SELECT TO "authenticated" USING (("job_id" IN ( SELECT "jobs"."id"
   FROM "public"."jobs"
  WHERE (("jobs"."user_id" = "auth"."uid"()) OR ("jobs"."contractor_id" = "auth"."uid"())))));



CREATE POLICY "Participants can update conversations" ON "public"."chat_conversations" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "contractor_id")));



CREATE POLICY "Payer can initiate payment" ON "public"."payments" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "payer_id"));



CREATE POLICY "Payment participants can view" ON "public"."payments" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "payer_id") OR ("auth"."uid"() = "payee_id")));



CREATE POLICY "Platform config readable by all authenticated" ON "public"."platform_config" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Profiles are viewable by authenticated users" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Recipients can mark messages read" ON "public"."chat_messages" FOR UPDATE TO "authenticated" USING ((("sender_id" <> "auth"."uid"()) AND ("conversation_id" IN ( SELECT "chat_conversations"."id"
   FROM "public"."chat_conversations"
  WHERE (("chat_conversations"."user_id" = "auth"."uid"()) OR ("chat_conversations"."contractor_id" = "auth"."uid"()))))));



CREATE POLICY "Reviews are publicly viewable" ON "public"."reviews" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Service categories readable by all authenticated" ON "public"."service_categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Service types readable by all authenticated" ON "public"."service_types" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "System can create conversations" ON "public"."chat_conversations" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "contractor_id")));



CREATE POLICY "Urgency tiers readable by all authenticated" ON "public"."urgency_tiers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can create reviews for their jobs" ON "public"."reviews" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "reviewer_id") AND ("job_id" IN ( SELECT "jobs"."id"
   FROM "public"."jobs"
  WHERE (("jobs"."user_id" = "auth"."uid"()) OR ("jobs"."contractor_id" = "auth"."uid"()))))));



CREATE POLICY "Users can mark own notifications read" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "recipient_id")) WITH CHECK (("auth"."uid"() = "recipient_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own jobs" ON "public"."jobs" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users see own notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "recipient_id"));



ALTER TABLE "public"."admin_action_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_action_log_insert_service_role" ON "public"."admin_action_log" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "admin_action_log_select_admins" ON "public"."admin_action_log" FOR SELECT USING ("public"."is_admin_user"());



ALTER TABLE "public"."admin_mfa_recovery_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_security_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_security_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contractor_bank_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contractor_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contractors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dispute_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dispute_evidence" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dispute_evidence_insert_admins_only" ON "public"."dispute_evidence" FOR INSERT WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "dispute_evidence_select_admins_only" ON "public"."dispute_evidence" FOR SELECT USING ("public"."is_admin_user"());



ALTER TABLE "public"."disputes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."finance_admin_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."finance_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_declined_contractors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_operations_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "job_operations_log_is_immutable" ON "public"."job_operations_log" FOR UPDATE USING (false);



CREATE POLICY "job_operations_log_no_delete" ON "public"."job_operations_log" FOR DELETE USING (false);



ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_deliveries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."platform_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promo_code_redemptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promo_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_ticket_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_ticket_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "support_ticket_messages_insert_admins" ON "public"."support_ticket_messages" FOR INSERT WITH CHECK (("public"."is_admin_user"() AND ("sender_role" = 'admin'::"text")));



CREATE POLICY "support_ticket_messages_insert_requesters" ON "public"."support_ticket_messages" FOR INSERT WITH CHECK ((("sender_id" = "auth"."uid"()) AND ("sender_role" = ANY (ARRAY['user'::"text", 'contractor'::"text"])) AND ("ticket_id" IN ( SELECT "support_tickets"."id"
   FROM "public"."support_tickets"
  WHERE ("support_tickets"."requester_id" = "auth"."uid"())))));



CREATE POLICY "support_ticket_messages_select_admins" ON "public"."support_ticket_messages" FOR SELECT USING ("public"."is_admin_user"());



CREATE POLICY "support_ticket_messages_select_requesters" ON "public"."support_ticket_messages" FOR SELECT USING (("ticket_id" IN ( SELECT "support_tickets"."id"
   FROM "public"."support_tickets"
  WHERE ("support_tickets"."requester_id" = "auth"."uid"()))));



CREATE POLICY "support_ticket_messages_update_admins_read" ON "public"."support_ticket_messages" FOR UPDATE USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."urgency_tiers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."withdrawals" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."jobs" TO "anon";
GRANT ALL ON TABLE "public"."jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."jobs" TO "service_role";



GRANT ALL ON FUNCTION "public"."accept_job"("p_job_id" "uuid", "p_contractor_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_job"("p_job_id" "uuid", "p_contractor_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_job"("p_job_id" "uuid", "p_contractor_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_contractor_verification"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_contractor_verification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_contractor_verification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."close_conversation_on_job_complete"() TO "anon";
GRANT ALL ON FUNCTION "public"."close_conversation_on_job_complete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."close_conversation_on_job_complete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."distance_km"("p_latitude_a" double precision, "p_longitude_a" double precision, "p_latitude_b" double precision, "p_longitude_b" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."distance_km"("p_latitude_a" double precision, "p_longitude_a" double precision, "p_latitude_b" double precision, "p_longitude_b" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."distance_km"("p_latitude_a" double precision, "p_longitude_a" double precision, "p_latitude_b" double precision, "p_longitude_b" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_nearby_broadcast_jobs"("p_radius_km" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."get_nearby_broadcast_jobs"("p_radius_km" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_nearby_broadcast_jobs"("p_radius_km" double precision) TO "service_role";



GRANT ALL ON TABLE "public"."contractors" TO "anon";
GRANT ALL ON TABLE "public"."contractors" TO "authenticated";
GRANT ALL ON TABLE "public"."contractors" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_nearby_contractors"("p_service_type" "text", "p_latitude" double precision, "p_longitude" double precision, "p_radius_km" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."get_nearby_contractors"("p_service_type" "text", "p_latitude" double precision, "p_longitude" double precision, "p_radius_km" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_nearby_contractors"("p_service_type" "text", "p_latitude" double precision, "p_longitude" double precision, "p_radius_km" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_contractor_eligible_for_job"("p_job" "public"."jobs", "p_radius_km" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."is_contractor_eligible_for_job"("p_job" "public"."jobs", "p_radius_km" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_contractor_eligible_for_job"("p_job" "public"."jobs", "p_radius_km" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."lookup_auth_methods"("p_identifier" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."lookup_auth_methods"("p_identifier" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."lookup_auth_methods"("p_identifier" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_nearby_contractors"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_nearby_contractors"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_nearby_contractors"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_contractor_role_row"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_contractor_role_row"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_contractor_role_row"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_contractor_acceptance_rate"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_contractor_acceptance_rate"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_contractor_acceptance_rate"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_contractor_rating"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_contractor_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_contractor_rating"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."admin_action_log" TO "anon";
GRANT ALL ON TABLE "public"."admin_action_log" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_action_log" TO "service_role";



GRANT ALL ON TABLE "public"."admin_mfa_recovery_codes" TO "anon";
GRANT ALL ON TABLE "public"."admin_mfa_recovery_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_mfa_recovery_codes" TO "service_role";



GRANT ALL ON TABLE "public"."admin_security_events" TO "anon";
GRANT ALL ON TABLE "public"."admin_security_events" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_security_events" TO "service_role";



GRANT ALL ON TABLE "public"."admin_security_settings" TO "anon";
GRANT ALL ON TABLE "public"."admin_security_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_security_settings" TO "service_role";



GRANT ALL ON TABLE "public"."chat_conversations" TO "anon";
GRANT ALL ON TABLE "public"."chat_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."contact_feedback" TO "anon";
GRANT ALL ON TABLE "public"."contact_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."contractor_bank_accounts" TO "anon";
GRANT ALL ON TABLE "public"."contractor_bank_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."contractor_bank_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."contractor_documents" TO "anon";
GRANT ALL ON TABLE "public"."contractor_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."contractor_documents" TO "service_role";



GRANT ALL ON TABLE "public"."dispute_events" TO "anon";
GRANT ALL ON TABLE "public"."dispute_events" TO "authenticated";
GRANT ALL ON TABLE "public"."dispute_events" TO "service_role";



GRANT ALL ON TABLE "public"."dispute_evidence" TO "anon";
GRANT ALL ON TABLE "public"."dispute_evidence" TO "authenticated";
GRANT ALL ON TABLE "public"."dispute_evidence" TO "service_role";



GRANT ALL ON TABLE "public"."disputes" TO "anon";
GRANT ALL ON TABLE "public"."disputes" TO "authenticated";
GRANT ALL ON TABLE "public"."disputes" TO "service_role";



GRANT ALL ON TABLE "public"."finance_admin_events" TO "anon";
GRANT ALL ON TABLE "public"."finance_admin_events" TO "authenticated";
GRANT ALL ON TABLE "public"."finance_admin_events" TO "service_role";



GRANT ALL ON TABLE "public"."finance_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."finance_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."finance_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."job_attachments" TO "anon";
GRANT ALL ON TABLE "public"."job_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."job_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."job_declined_contractors" TO "anon";
GRANT ALL ON TABLE "public"."job_declined_contractors" TO "authenticated";
GRANT ALL ON TABLE "public"."job_declined_contractors" TO "service_role";



GRANT ALL ON TABLE "public"."job_operations_log" TO "anon";
GRANT ALL ON TABLE "public"."job_operations_log" TO "authenticated";
GRANT ALL ON TABLE "public"."job_operations_log" TO "service_role";



GRANT ALL ON TABLE "public"."notification_campaigns" TO "anon";
GRANT ALL ON TABLE "public"."notification_campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."notification_deliveries" TO "anon";
GRANT ALL ON TABLE "public"."notification_deliveries" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_deliveries" TO "service_role";



GRANT ALL ON TABLE "public"."notification_templates" TO "anon";
GRANT ALL ON TABLE "public"."notification_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_templates" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."platform_config" TO "anon";
GRANT ALL ON TABLE "public"."platform_config" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_config" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."promo_code_redemptions" TO "anon";
GRANT ALL ON TABLE "public"."promo_code_redemptions" TO "authenticated";
GRANT ALL ON TABLE "public"."promo_code_redemptions" TO "service_role";



GRANT ALL ON TABLE "public"."promo_codes" TO "anon";
GRANT ALL ON TABLE "public"."promo_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."promo_codes" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."service_categories" TO "anon";
GRANT ALL ON TABLE "public"."service_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."service_categories" TO "service_role";



GRANT ALL ON TABLE "public"."service_types" TO "anon";
GRANT ALL ON TABLE "public"."service_types" TO "authenticated";
GRANT ALL ON TABLE "public"."service_types" TO "service_role";



GRANT ALL ON TABLE "public"."support_ticket_events" TO "anon";
GRANT ALL ON TABLE "public"."support_ticket_events" TO "authenticated";
GRANT ALL ON TABLE "public"."support_ticket_events" TO "service_role";



GRANT ALL ON TABLE "public"."support_ticket_messages" TO "anon";
GRANT ALL ON TABLE "public"."support_ticket_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."support_ticket_messages" TO "service_role";



GRANT ALL ON TABLE "public"."support_tickets" TO "anon";
GRANT ALL ON TABLE "public"."support_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."support_tickets" TO "service_role";



GRANT ALL ON TABLE "public"."urgency_tiers" TO "anon";
GRANT ALL ON TABLE "public"."urgency_tiers" TO "authenticated";
GRANT ALL ON TABLE "public"."urgency_tiers" TO "service_role";



GRANT ALL ON TABLE "public"."withdrawals" TO "anon";
GRANT ALL ON TABLE "public"."withdrawals" TO "authenticated";
GRANT ALL ON TABLE "public"."withdrawals" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







