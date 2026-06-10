


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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





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
  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id FOR UPDATE;

  IF v_job IS NULL THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  IF v_job.status != 'broadcast' THEN
    RAISE EXCEPTION 'Job is no longer available';
  END IF;

  UPDATE public.jobs
  SET contractor_id = p_contractor_id, status = 'accepted', accepted_at = now()
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
BEGIN
  IF NEW.id_verification_complete AND NEW.police_check_complete AND NEW.service_licences_complete THEN
    NEW.is_verified = true;
  END IF;
  RETURN NEW;
END;
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
    CONSTRAINT "contractors_availability_status_check" CHECK (("availability_status" = ANY (ARRAY['online'::"text", 'offline'::"text", 'busy'::"text", 'pending_approval'::"text"])))
);


ALTER TABLE "public"."contractors" OWNER TO "postgres";


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
    "currency" "text" DEFAULT 'usd'::"text" NOT NULL,
    "capture_method" "text" DEFAULT 'manual'::"text" NOT NULL,
    "stripe_charge_id" "text",
    "stripe_application_fee_amount" integer,
    "captured_at" timestamp with time zone,
    "refunded_at" timestamp with time zone,
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
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."service_types" OWNER TO "postgres";


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
    CONSTRAINT "withdrawals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."withdrawals" OWNER TO "postgres";


ALTER TABLE ONLY "public"."chat_conversations"
    ADD CONSTRAINT "chat_conversations_job_id_key" UNIQUE ("job_id");



ALTER TABLE ONLY "public"."chat_conversations"
    ADD CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contractor_bank_accounts"
    ADD CONSTRAINT "contractor_bank_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contractor_documents"
    ADD CONSTRAINT "contractor_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contractors"
    ADD CONSTRAINT "contractors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_attachments"
    ADD CONSTRAINT "job_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_declined_contractors"
    ADD CONSTRAINT "job_declined_contractors_pkey" PRIMARY KEY ("job_id", "contractor_id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_config"
    ADD CONSTRAINT "platform_config_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."urgency_tiers"
    ADD CONSTRAINT "urgency_tiers_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."urgency_tiers"
    ADD CONSTRAINT "urgency_tiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."withdrawals"
    ADD CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_chat_conversations_job" ON "public"."chat_conversations" USING "btree" ("job_id");



CREATE INDEX "idx_chat_messages_conversation" ON "public"."chat_messages" USING "btree" ("conversation_id", "created_at");



CREATE INDEX "idx_contractor_bank_accounts_contractor" ON "public"."contractor_bank_accounts" USING "btree" ("contractor_id");



CREATE INDEX "idx_contractor_documents_contractor" ON "public"."contractor_documents" USING "btree" ("contractor_id");



CREATE INDEX "idx_contractors_available" ON "public"."contractors" USING "btree" ("availability_status") WHERE ("availability_status" = 'online'::"text");



CREATE INDEX "idx_contractors_stripe_account" ON "public"."contractors" USING "btree" ("stripe_account_id") WHERE ("stripe_account_id" IS NOT NULL);



CREATE INDEX "idx_jobs_broadcast" ON "public"."jobs" USING "btree" ("status") WHERE ("status" = 'broadcast'::"text");



CREATE INDEX "idx_jobs_contractor_id" ON "public"."jobs" USING "btree" ("contractor_id");



CREATE INDEX "idx_jobs_status" ON "public"."jobs" USING "btree" ("status");



CREATE INDEX "idx_jobs_user_id" ON "public"."jobs" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_recipient" ON "public"."notifications" USING "btree" ("recipient_id", "created_at" DESC);



CREATE INDEX "idx_notifications_unread" ON "public"."notifications" USING "btree" ("recipient_id") WHERE ("read_at" IS NULL);



CREATE INDEX "idx_payments_job" ON "public"."payments" USING "btree" ("job_id");



CREATE INDEX "idx_payments_payee" ON "public"."payments" USING "btree" ("payee_id");



CREATE INDEX "idx_payments_stripe_charge" ON "public"."payments" USING "btree" ("stripe_charge_id") WHERE ("stripe_charge_id" IS NOT NULL);



CREATE INDEX "idx_payments_stripe_intent" ON "public"."payments" USING "btree" ("stripe_payment_intent_id") WHERE ("stripe_payment_intent_id" IS NOT NULL);



CREATE INDEX "idx_profiles_email_lower" ON "public"."profiles" USING "btree" ("lower"("email"));



CREATE INDEX "idx_profiles_phone" ON "public"."profiles" USING "btree" ("phone");



CREATE INDEX "idx_profiles_stripe_customer" ON "public"."profiles" USING "btree" ("stripe_customer_id") WHERE ("stripe_customer_id" IS NOT NULL);



CREATE INDEX "idx_reviews_reviewee" ON "public"."reviews" USING "btree" ("reviewee_id");



CREATE INDEX "idx_service_types_category" ON "public"."service_types" USING "btree" ("category_id");



CREATE INDEX "idx_withdrawals_stripe_payout" ON "public"."withdrawals" USING "btree" ("stripe_payout_id") WHERE ("stripe_payout_id" IS NOT NULL);



CREATE OR REPLACE TRIGGER "on_contractor_verification_update" BEFORE UPDATE ON "public"."contractors" FOR EACH ROW EXECUTE FUNCTION "public"."check_contractor_verification"();



CREATE OR REPLACE TRIGGER "on_job_completed_close_chat" AFTER UPDATE OF "status" ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."close_conversation_on_job_complete"();



CREATE OR REPLACE TRIGGER "on_job_status_changed" AFTER UPDATE OF "status" ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_contractor_acceptance_rate"();



CREATE OR REPLACE TRIGGER "on_profile_role_sync_contractor" AFTER INSERT OR UPDATE OF "role" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_contractor_role_row"();



CREATE OR REPLACE TRIGGER "on_review_created" AFTER INSERT ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_contractor_rating"();



CREATE OR REPLACE TRIGGER "set_chat_conversations_updated_at" BEFORE UPDATE ON "public"."chat_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_contractors_updated_at" BEFORE UPDATE ON "public"."contractors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_jobs_updated_at" BEFORE UPDATE ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_payments_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



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



ALTER TABLE ONLY "public"."job_attachments"
    ADD CONSTRAINT "job_attachments_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_attachments"
    ADD CONSTRAINT "job_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."job_declined_contractors"
    ADD CONSTRAINT "job_declined_contractors_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."job_declined_contractors"
    ADD CONSTRAINT "job_declined_contractors_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_payee_id_fkey" FOREIGN KEY ("payee_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewee_id_fkey" FOREIGN KEY ("reviewee_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."service_types"
    ADD CONSTRAINT "service_types_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."withdrawals"
    ADD CONSTRAINT "withdrawals_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "public"."contractor_bank_accounts"("id");



ALTER TABLE ONLY "public"."withdrawals"
    ADD CONSTRAINT "withdrawals_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "public"."contractors"("id");



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



CREATE POLICY "Contractors can view available and assigned jobs" ON "public"."jobs" FOR SELECT TO "authenticated" USING ((("status" = 'broadcast'::"text") OR ("auth"."uid"() = "contractor_id")));



CREATE POLICY "Contractors see own bank accounts" ON "public"."contractor_bank_accounts" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "contractor_id"));



CREATE POLICY "Contractors see own documents" ON "public"."contractor_documents" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "contractor_id"));



CREATE POLICY "Contractors see own withdrawals" ON "public"."withdrawals" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "contractor_id"));



CREATE POLICY "Contractors viewable by authenticated users" ON "public"."contractors" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Declined visible to job owner and contractor" ON "public"."job_declined_contractors" FOR SELECT TO "authenticated" USING ((("contractor_id" = "auth"."uid"()) OR ("job_id" IN ( SELECT "jobs"."id"
   FROM "public"."jobs"
  WHERE ("jobs"."user_id" = "auth"."uid"())))));



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



ALTER TABLE "public"."chat_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contractor_bank_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contractor_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contractors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_declined_contractors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."platform_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."urgency_tiers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."withdrawals" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."chat_conversations";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."chat_messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."contractors";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."jobs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



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



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."lookup_auth_methods"("p_identifier" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."lookup_auth_methods"("p_identifier" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."lookup_auth_methods"("p_identifier" "text") TO "service_role";



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


















GRANT ALL ON TABLE "public"."chat_conversations" TO "anon";
GRANT ALL ON TABLE "public"."chat_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."contractor_bank_accounts" TO "anon";
GRANT ALL ON TABLE "public"."contractor_bank_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."contractor_bank_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."contractor_documents" TO "anon";
GRANT ALL ON TABLE "public"."contractor_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."contractor_documents" TO "service_role";



GRANT ALL ON TABLE "public"."contractors" TO "anon";
GRANT ALL ON TABLE "public"."contractors" TO "authenticated";
GRANT ALL ON TABLE "public"."contractors" TO "service_role";



GRANT ALL ON TABLE "public"."job_attachments" TO "anon";
GRANT ALL ON TABLE "public"."job_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."job_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."job_declined_contractors" TO "anon";
GRANT ALL ON TABLE "public"."job_declined_contractors" TO "authenticated";
GRANT ALL ON TABLE "public"."job_declined_contractors" TO "service_role";



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



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."service_categories" TO "anon";
GRANT ALL ON TABLE "public"."service_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."service_categories" TO "service_role";



GRANT ALL ON TABLE "public"."service_types" TO "anon";
GRANT ALL ON TABLE "public"."service_types" TO "authenticated";
GRANT ALL ON TABLE "public"."service_types" TO "service_role";



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































drop extension if exists "pg_net";

drop trigger if exists "set_chat_conversations_updated_at" on "public"."chat_conversations";

drop trigger if exists "on_contractor_verification_update" on "public"."contractors";

drop trigger if exists "set_contractors_updated_at" on "public"."contractors";

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

drop policy "Job participants can view attachments" on "public"."job_attachments";

drop policy "Declined visible to job owner and contractor" on "public"."job_declined_contractors";

drop policy "Users can create reviews for their jobs" on "public"."reviews";

alter table "public"."chat_conversations" drop constraint "chat_conversations_contractor_id_fkey";

alter table "public"."chat_conversations" drop constraint "chat_conversations_job_id_fkey";

alter table "public"."chat_conversations" drop constraint "chat_conversations_user_id_fkey";

alter table "public"."chat_messages" drop constraint "chat_messages_conversation_id_fkey";

alter table "public"."chat_messages" drop constraint "chat_messages_sender_id_fkey";

alter table "public"."contractor_bank_accounts" drop constraint "contractor_bank_accounts_contractor_id_fkey";

alter table "public"."contractor_documents" drop constraint "contractor_documents_contractor_id_fkey";

alter table "public"."contractor_documents" drop constraint "contractor_documents_reviewed_by_fkey";

alter table "public"."contractors" drop constraint "contractors_id_fkey";

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

CREATE OR REPLACE FUNCTION public.accept_job(p_job_id uuid, p_contractor_id uuid)
 RETURNS public.jobs
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_job public.jobs;
BEGIN
  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id FOR UPDATE;

  IF v_job IS NULL THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  IF v_job.status != 'broadcast' THEN
    RAISE EXCEPTION 'Job is no longer available';
  END IF;

  UPDATE public.jobs
  SET contractor_id = p_contractor_id, status = 'accepted', accepted_at = now()
  WHERE id = p_job_id
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$function$
;


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



  create policy "Users can create reviews for their jobs"
  on "public"."reviews"
  as permissive
  for insert
  to authenticated
with check (((auth.uid() = reviewer_id) AND (job_id IN ( SELECT jobs.id
   FROM public.jobs
  WHERE ((jobs.user_id = auth.uid()) OR (jobs.contractor_id = auth.uid()))))));


CREATE TRIGGER set_chat_conversations_updated_at BEFORE UPDATE ON public.chat_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER on_contractor_verification_update BEFORE UPDATE ON public.contractors FOR EACH ROW EXECUTE FUNCTION public.check_contractor_verification();

CREATE TRIGGER set_contractors_updated_at BEFORE UPDATE ON public.contractors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER on_job_completed_close_chat AFTER UPDATE OF status ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.close_conversation_on_job_complete();

CREATE TRIGGER on_job_status_changed AFTER UPDATE OF status ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_contractor_acceptance_rate();

CREATE TRIGGER set_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER on_profile_role_sync_contractor AFTER INSERT OR UPDATE OF role ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.sync_contractor_role_row();

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER on_review_created AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_contractor_rating();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Avatar owner update"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Avatar owner upload"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Avatar public read"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



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



  create policy "Contractor doc read"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'contractor-documents'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Contractor doc upload"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'contractor-documents'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Job attachment read"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'job-attachments'::text) AND ((storage.foldername(name))[1] IN ( SELECT (jobs.id)::text AS id
   FROM public.jobs
  WHERE ((jobs.user_id = auth.uid()) OR (jobs.contractor_id = auth.uid()))))));



  create policy "Job attachment upload"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'job-attachments'::text));



