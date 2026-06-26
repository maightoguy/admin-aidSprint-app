
  create table "public"."contact_feedback" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "email" text not null,
    "message" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."contact_feedback" enable row level security;

CREATE UNIQUE INDEX contact_feedback_pkey ON public.contact_feedback USING btree (id);

CREATE INDEX idx_contact_feedback_created_at ON public.contact_feedback USING btree (created_at DESC);

CREATE INDEX idx_contact_feedback_email ON public.contact_feedback USING btree (email);

alter table "public"."contact_feedback" add constraint "contact_feedback_pkey" PRIMARY KEY using index "contact_feedback_pkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_contractor_verification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

grant delete on table "public"."contact_feedback" to "anon";

grant insert on table "public"."contact_feedback" to "anon";

grant references on table "public"."contact_feedback" to "anon";

grant select on table "public"."contact_feedback" to "anon";

grant trigger on table "public"."contact_feedback" to "anon";

grant truncate on table "public"."contact_feedback" to "anon";

grant update on table "public"."contact_feedback" to "anon";

grant delete on table "public"."contact_feedback" to "authenticated";

grant insert on table "public"."contact_feedback" to "authenticated";

grant references on table "public"."contact_feedback" to "authenticated";

grant select on table "public"."contact_feedback" to "authenticated";

grant trigger on table "public"."contact_feedback" to "authenticated";

grant truncate on table "public"."contact_feedback" to "authenticated";

grant update on table "public"."contact_feedback" to "authenticated";

grant delete on table "public"."contact_feedback" to "service_role";

grant insert on table "public"."contact_feedback" to "service_role";

grant references on table "public"."contact_feedback" to "service_role";

grant select on table "public"."contact_feedback" to "service_role";

grant trigger on table "public"."contact_feedback" to "service_role";

grant truncate on table "public"."contact_feedback" to "service_role";

grant update on table "public"."contact_feedback" to "service_role";


  create policy "Admins can read contact feedback"
  on "public"."contact_feedback"
  as permissive
  for select
  to authenticated
using (public.is_admin_user());



  create policy "Anyone can insert contact feedback"
  on "public"."contact_feedback"
  as permissive
  for insert
  to anon, authenticated
with check (true);



