Jason state at each step--

Step 1: Create a brand-new contractor in staging.
Step 2: Before uploading any KYC docs, inspect that contractor row.
---- [{"idx":0,"id":"44f192c4-e099-4406-aa4c-ee93b203cef3","services":[],"certifications":[],"rating":"0.00","total_ratings":0,"acceptance_rate":"0.0000","total_jobs_offered":0,"total_jobs_accepted":0,"availability_status":"offline","current_latitude":null,"current_longitude":null,"location_updated_at":null,"is_verified":false,"id_verification_complete":false,"police_check_complete":false,"service_licences_complete":false,"created_at":"2026-06-19 09:23:03.08139+00","updated_at":"2026-06-19 09:23:03.08139+00","stripe_account_id":null,"stripe_onboarding_completed":false,"stripe_charges_enabled":false,"stripe_payouts_enabled":false,"payouts_blocked_reason":null,"suspended_at":null,"suspended_by":null,"suspension_reason":null,"restored_at":null,"restored_by":null,"restore_reason":null}]

Step 3: Upload the KYC docs in the Android app.
Step 4: Inspect the same contractor row again, before clicking any admin approve/reject button.

------[{"idx":0,"id":"44f192c4-e099-4406-aa4c-ee93b203cef3","services":["Electrician","Babysitting","Handyman","Locksmith","Plumbing","PSW care","Cleaning","Petsitter"],"certifications":[],"rating":"0.00","total_ratings":0,"acceptance_rate":"0.0000","total_jobs_offered":0,"total_jobs_accepted":0,"availability_status":"offline","current_latitude":null,"current_longitude":null,"location_updated_at":null,"is_verified":true,"id_verification_complete":true,"police_check_complete":true,"service_licences_complete":true,"created_at":"2026-06-19 09:23:03.08139+00","updated_at":"2026-06-19 09:28:54.798583+00","stripe_account_id":null,"stripe_onboarding_completed":false,"stripe_charges_enabled":false,"stripe_payouts_enabled":false,"payouts_blocked_reason":null,"suspended_at":null,"suspended_by":null,"suspension_reason":null,"restored_at":null,"restored_by":null,"restore_reason":null}]

Step 5: Inspect the contractor_documents rows for that contractor.

---

[{"idx":2,"id":"2169df6e-2f18-4953-8c39-0e925b3409ea","contractor_id":"44f192c4-e099-4406-aa4c-ee93b203cef3","document_type":"service_licence","storage_path":"44f192c4-e099-4406-aa4c-ee93b203cef3/service_licence/1781861335969_scaled_IMG-20260618-WA0004.jpg","file_name":"scaled_IMG-20260618-WA0004.jpg","mime_type":"image/jpeg","status":"pending","reviewed_at":null,"reviewed_by":null,"rejection_reason":null,"created_at":"2026-06-19 09:28:54.395181+00"},{"idx":8,"id":"8110a168-4023-469a-a7ee-f78bed1fb57b","contractor_id":"44f192c4-e099-4406-aa4c-ee93b203cef3","document_type":"police_check","storage_path":"44f192c4-e099-4406-aa4c-ee93b203cef3/police_check/1781861316719_scaled_IMG-20260618-WA0004.jpg","file_name":"scaled_IMG-20260618-WA0004.jpg","mime_type":"image/jpeg","status":"pending","reviewed_at":null,"reviewed_by":null,"rejection_reason":null,"created_at":"2026-06-19 09:28:35.52513+00"},{"idx":12,"id":"d9123056-a8fd-4bdd-b0ae-a11e611334e3","contractor_id":"44f192c4-e099-4406-aa4c-ee93b203cef3","document_type":"drivers_licence","storage_path":"44f192c4-e099-4406-aa4c-ee93b203cef3/drivers_licence/1781861282187_scaled_IMG-20260618-WA0004.jpg","file_name":"scaled_IMG-20260618-WA0004.jpg","mime_type":"image/jpeg","status":"pending","reviewed_at":null,"reviewed_by":null,"rejection_reason":null,"created_at":"2026-06-19 09:28:01.146229+00"}]

## Step 6: Only after that, approve documents in admin and inspect again.

[{"idx":0,"id":"44f192c4-e099-4406-aa4c-ee93b203cef3","services":["Electrician","Babysitting","Handyman","Locksmith","Plumbing","PSW care","Cleaning","Petsitter"],"certifications":[],"rating":"0.00","total_ratings":0,"acceptance_rate":"0.0000","total_jobs_offered":0,"total_jobs_accepted":0,"availability_status":"offline","current_latitude":null,"current_longitude":null,"location_updated_at":null,"is_verified":true,"id_verification_complete":true,"police_check_complete":true,"service_licences_complete":true,"created_at":"2026-06-19 09:23:03.08139+00","updated_at":"2026-06-19 09:28:54.798583+00","stripe_account_id":null,"stripe_onboarding_completed":false,"stripe_charges_enabled":false,"stripe_payouts_enabled":false,"payouts_blocked_reason":null,"suspended_at":null,"suspended_by":null,"suspension_reason":null,"restored_at":null,"restored_by":null,"restore_reason":null}]

## Confirmed problem summary

- The contractor row starts in the expected initial state:
  - `is_verified = false`
  - `id_verification_complete = false`
  - `police_check_complete = false`
  - `service_licences_complete = false`
- Immediately after KYC upload from Android, before any admin approve/reject action:
  - `is_verified = true`
  - all three contractor-level completion flags become `true`
  - the uploaded `contractor_documents` rows still remain `status = pending`
  - `reviewed_at` and `reviewed_by` are still `null`
- This proves the platform is promoting contractor verification too early during the upload flow, before admin review is completed.

## Unresolved pin

- Status: `OPEN - yet to be resolved`
- Owner: mobile/backend follow-up
- Problem statement: the mobile/backend flow is likely setting `id_verification_complete`, `police_check_complete`, and `service_licences_complete` to `true` during document upload instead of after admin approval; the verification trigger then promotes `is_verified = true` from those flags.
- Why pinned: this is a platform-level contract issue and should not be changed blindly from the admin repo without confirmation from the mobile/backend side.
- Safe admin-side mitigation already applied: the admin dashboard now derives the visible verification badge from document review statuses first, so pending documents do not show as verified in the admin UI.
- Next step when we return to this:
  - identify where those three contractor-level flags are written
  - confirm whether Android writes them directly or another backend workflow does
  - redesign the verification contract so upload completion and admin approval remain separate lifecycle states
