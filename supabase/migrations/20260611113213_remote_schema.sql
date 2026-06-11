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



