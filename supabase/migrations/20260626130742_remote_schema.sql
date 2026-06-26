drop policy "Chat attachment read" on "storage"."objects";

drop policy "Chat attachment upload" on "storage"."objects";

drop policy "Job attachment read" on "storage"."objects";


  create policy "Admin contractor doc read"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'contractor-documents'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))));



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



