
  create policy "Finance admin can cancel payments"
  on "public"."payments"
  as permissive
  for update
  to public
with check ((public.is_admin_user() AND (status = ANY (ARRAY['pending'::text, 'requires_payment_method'::text])) AND (auth.uid() <> gen_random_uuid())));



  create policy "Finance admin can mark payment failed"
  on "public"."payments"
  as permissive
  for update
  to public
with check ((public.is_admin_user() AND (status = ANY (ARRAY['pending'::text, 'processing'::text, 'authorized'::text, 'captured'::text, 'paid'::text])) AND (auth.uid() <> gen_random_uuid())));



  create policy "Finance admin can refund payments"
  on "public"."payments"
  as permissive
  for update
  to public
with check ((public.is_admin_user() AND (status = ANY (ARRAY['captured'::text, 'paid'::text])) AND (auth.uid() <> gen_random_uuid())));



  create policy "Finance admin can manage withdrawals"
  on "public"."withdrawals"
  as permissive
  for update
  to public
with check ((public.is_admin_user() AND (status = ANY (ARRAY['pending'::text, 'processing'::text])) AND (auth.uid() <> gen_random_uuid())));



