SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict yD6xZmSabRMn8gVVgRPAPlvantMmcIWoXDauKo8c6PpHb9qKlCj8exwLUcJPMgg

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") VALUES
	('c6be2569-1944-4658-8347-6177e87e74f3', 'd8253826-69b1-4bf6-96d5-0330ad5b56ce', '765e48cc-754a-40bc-8131-928295be4150', 's256', 'qrIFb2Vr7-YyVF944HZjw87Rq3Qv_9A1iVHjWnKFlco', 'email', '', '', '2026-04-21 23:07:30.013078+00', '2026-04-21 23:07:30.013078+00', 'email/signup', NULL, NULL, NULL, NULL, NULL, false),
	('60eb07a4-38a2-403a-a1d4-74b9304d4142', '6d862ac2-c504-4ce9-a025-f1eae781451f', 'b79fb25f-b300-4a2d-b57c-b82ded1f58a9', 's256', '3YjxifgDfxcWFmXEwNVFRTGr3SKP7lU2cUlUUDJEcOA', 'email', '', '', '2026-04-21 23:15:02.869664+00', '2026-04-21 23:15:02.869664+00', 'email/signup', NULL, NULL, NULL, NULL, NULL, false),
	('a5a5c877-bcdd-4e86-affc-7d618f5fee14', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '77483c6a-98b2-4625-b2fa-ee97f0cd6ad1', 's256', 'jnHFDpUi05IGm9Z11fTVO5V3c_A6Skzf0-bsCg3Xh40', 'magiclink', '', '', '2026-05-02 22:19:55.042221+00', '2026-05-02 22:19:55.042221+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('f8fc364d-a77d-4a68-bdda-424f364d88d7', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '6b64979d-cccf-4c79-80e5-97d4396eff2f', 's256', 'GJKHX4dPAubELpqnbYy5F8L8DNo4XdsLL2OKF2ooQ44', 'magiclink', '', '', '2026-05-02 22:20:24.106631+00', '2026-05-02 22:20:24.106631+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('b0522803-7fb0-47b0-9590-9f84f8bd03b6', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', 'af7a4aee-14d5-4885-80b1-8be3ae2ee8e2', 's256', 'JHB8hPv0ihNzHhDkigyz2IBX545o2ZmDvFGDi8Wsfp8', 'magiclink', '', '', '2026-05-02 22:21:06.001233+00', '2026-05-02 22:21:06.001233+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('d28a9c1a-c453-4b81-a126-d22ccb735df9', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', '57a9a4c8-e27a-4d4c-ad70-25e9f66d38df', 's256', 'ylRQ33EbVt5w-LaZH7BwR9N3Wue5aGmec4TimV7RQpE', 'magiclink', '', '', '2026-05-03 08:58:56.498272+00', '2026-05-03 08:58:56.498272+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('7a438cf6-e763-4ef2-ba2d-0e9e7052da7b', '4e191067-4c1f-434c-af6c-7b1541989891', '3871986f-82a0-4ae5-93cf-1df372a4b626', 's256', 'n_y5Q7VjUKra5Oj0YXIe7_jkifDUwfnmD9PHLs4JNeE', 'magiclink', '', '', '2026-05-03 10:39:21.502344+00', '2026-05-03 10:39:21.502344+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('d29fd05f-fea7-4b9b-9e5e-1f7b0467cd88', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', 'f90bd040-0b2b-45b2-bf28-1f1428b37d98', 's256', 'vcT1eHbFoAoF6vXPKfeoPN42P6lpAVINMlcS04V6378', 'magiclink', '', '', '2026-05-04 14:36:49.501932+00', '2026-05-04 14:36:49.501932+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false);


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', 'authenticated', 'authenticated', 'oladunnirotimi13@gmail.com', '$2a$10$hPmUmqsAWoYdYIkuaf4z/OH9Sagc/g0nV08migwyQWkKSKoB2VSKq', '2026-05-03 08:58:56.442898+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-05-04 13:28:50.439813+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "8c25fba9-c744-4dda-a03b-a4d1ef88f1aa", "role": "contractor", "email": "oladunnirotimi13@gmail.com", "phone": "+2347075103141", "gender": "Male", "full_name": "Rotimi Oladunni", "email_verified": true, "phone_verified": false, "linked_auth_methods": ["email"]}', NULL, '2026-05-03 08:58:56.403332+00', '2026-05-04 13:28:50.489337+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '4e191067-4c1f-434c-af6c-7b1541989891', 'authenticated', 'authenticated', 'rhotex.exchange@gmail.com', '$2a$10$iQMbcB8uXX5GPb90PXOJp.Qi02S7KOHIWJRx64RKWxgnlv7C7uwSa', '2026-05-03 10:39:21.472877+00', NULL, '', NULL, 'pkce_a87432466f65f9524d2c13f8801c13d20d299c63d939587f07d54d1c', '2026-05-03 10:39:21.510406+00', '', '', NULL, '2026-05-03 10:39:21.481337+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "4e191067-4c1f-434c-af6c-7b1541989891", "email": "rhotex.exchange@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-05-03 10:39:21.430871+00', '2026-05-03 10:39:21.944868+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', 'authenticated', 'authenticated', 'jasonsaliu@gmail.com', '$2a$10$4el6EtA90CEZabzuAo22meROnikX6bz6t0/HjfQCK6efpAyOk2ie.', '2026-04-22 11:19:59.349322+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-04-27 10:16:03.218212+00', '{"provider": "email", "providers": ["email"]}', '{"role": "user", "phone": "+2349017474218", "gender": "Male", "full_name": "Johnson saliu", "email_verified": true, "linked_auth_methods": ["email"]}', NULL, '2026-04-22 11:19:59.321372+00', '2026-05-21 16:49:40.333991+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', 'authenticated', 'authenticated', 'johnsonsaliu4real@gmail.com', '$2a$10$yENDWyODNUi6f5dyMwC/6ONeKm3Eug6eyVA1qOf4L7OnjPO7dvEJO', '2026-05-02 08:43:21.249665+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-05-02 08:43:21.556065+00', '{"provider": "email", "providers": ["email"]}', '{"role": "contractor", "phone": "+2349018484210", "gender": "Male", "full_name": "EJ Test", "email_verified": true, "linked_auth_methods": ["email"]}', NULL, '2026-05-02 08:43:21.210738+00', '2026-05-04 08:11:06.349602+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', 'authenticated', 'authenticated', 'oladunjoyeisabella@gmail.com', '$2a$10$MCcdRfCc7Nw1zT5FpvmztO6ZMNPQEkmJmDHfw.vgX6Mm.6dG6UCRW', '2026-05-02 22:19:54.960218+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-05-04 14:37:45.783581+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "a8bd45b0-5413-44b2-aef2-6bd74478a8a3", "role": "user", "email": "oladunjoyeisabella@gmail.com", "phone": "+14378789167", "gender": "Female", "full_name": "Oluwanifemi oladunjoye", "email_verified": true, "phone_verified": false, "linked_auth_methods": ["email"]}', NULL, '2026-05-02 22:19:54.860762+00', '2026-06-10 23:55:30.766449+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '0a998373-8941-4ad7-b52a-2b697d3b2795', 'authenticated', 'authenticated', 'aidsprintsolutions@gmail.com', '$2a$10$Q/BTcdf67hRxVN/fHcM29.3vwGkQL5IM7zU4W0oC3ys9pOFsno/hu', '2026-06-11 07:19:12.624423+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-06-11 07:19:12.5925+00', '2026-06-11 07:19:12.625332+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '8651a2dd-bd57-40c0-8584-2ce29a8ad760', 'authenticated', 'authenticated', 'maightoguy@gmail.com', '$2a$10$WyuVObu8n75JjuRQ/b3hi.SUaYiuC4k/d/vOMOFYmt.Cbyr3auvwG', '2026-06-10 13:41:31.034071+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-06-11 10:23:41.509875+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-06-10 13:41:31.004077+00', '2026-06-11 11:23:41.852861+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '{"sub": "c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c", "email": "jasonsaliu@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-04-22 11:19:59.343692+00', '2026-04-22 11:19:59.343753+00', '2026-04-22 11:19:59.343753+00', '373484d7-d24c-4c22-9434-fe64e24b633e'),
	('5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', '{"sub": "5dad96d8-a31a-42be-9c51-15a1e9a7d1fb", "email": "johnsonsaliu4real@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-05-02 08:43:21.247259+00', '2026-05-02 08:43:21.247316+00', '2026-05-02 08:43:21.247316+00', '3d69e061-9c57-42d1-af3e-cd70258f9f12'),
	('a8bd45b0-5413-44b2-aef2-6bd74478a8a3', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '{"sub": "a8bd45b0-5413-44b2-aef2-6bd74478a8a3", "email": "oladunjoyeisabella@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-05-02 22:19:54.944588+00', '2026-05-02 22:19:54.944637+00', '2026-05-02 22:19:54.944637+00', 'dff4a8b8-ab8c-44bd-bc62-776007d6e557'),
	('8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', '{"sub": "8c25fba9-c744-4dda-a03b-a4d1ef88f1aa", "email": "oladunnirotimi13@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-05-03 08:58:56.439207+00', '2026-05-03 08:58:56.439256+00', '2026-05-03 08:58:56.439256+00', '09512c24-ab68-4569-840b-e6c751c53077'),
	('4e191067-4c1f-434c-af6c-7b1541989891', '4e191067-4c1f-434c-af6c-7b1541989891', '{"sub": "4e191067-4c1f-434c-af6c-7b1541989891", "email": "rhotex.exchange@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-05-03 10:39:21.467141+00', '2026-05-03 10:39:21.467188+00', '2026-05-03 10:39:21.467188+00', '8750f0e4-285c-47d0-b490-a3ec5e199d45'),
	('8651a2dd-bd57-40c0-8584-2ce29a8ad760', '8651a2dd-bd57-40c0-8584-2ce29a8ad760', '{"sub": "8651a2dd-bd57-40c0-8584-2ce29a8ad760", "email": "maightoguy@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-06-10 13:41:31.030316+00', '2026-06-10 13:41:31.030405+00', '2026-06-10 13:41:31.030405+00', 'd1f11990-d34c-4f5e-98f4-f1be035ba030'),
	('0a998373-8941-4ad7-b52a-2b697d3b2795', '0a998373-8941-4ad7-b52a-2b697d3b2795', '{"sub": "0a998373-8941-4ad7-b52a-2b697d3b2795", "email": "aidsprintsolutions@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-06-11 07:19:12.618073+00', '2026-06-11 07:19:12.618129+00', '2026-06-11 07:19:12.618129+00', '96783e3d-9996-4b8e-bdee-4cb2a617dbe6');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('aa1d540d-ab00-4e61-a2eb-d41be8386414', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-27 10:16:03.218327+00', '2026-04-27 10:16:03.218327+00', NULL, 'aal1', NULL, NULL, 'Dart/3.9 (dart:io)', '102.89.34.230', NULL, NULL, NULL, NULL, NULL),
	('462b83df-5d4f-4d4c-b1c6-8b27bd061243', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 11:19:59.652822+00', '2026-05-21 16:49:40.346696+00', NULL, 'aal1', NULL, '2026-05-21 16:49:40.34659', 'Dart/3.9 (dart:io)', '102.88.112.198', NULL, NULL, NULL, NULL, NULL),
	('da89a65c-8463-4a18-bd56-7eb4dc47ed79', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '2026-05-04 14:37:45.784777+00', '2026-06-10 23:55:30.778039+00', NULL, 'aal1', NULL, '2026-06-10 23:55:30.777924', 'Dart/3.9 (dart:io)', '99.232.48.253', NULL, NULL, NULL, NULL, NULL),
	('0c8a41ae-60c5-476c-88ea-82bda8e4a8b6', '4e191067-4c1f-434c-af6c-7b1541989891', '2026-05-03 10:39:21.482479+00', '2026-05-03 10:39:21.482479+00', NULL, 'aal1', NULL, NULL, 'Dart/3.9 (dart:io)', '102.91.71.205', NULL, NULL, NULL, NULL, NULL),
	('15aa1d7e-55f4-41cd-9448-557753aa1468', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', '2026-05-02 08:43:21.559986+00', '2026-05-04 08:11:06.363621+00', NULL, 'aal1', NULL, '2026-05-04 08:11:06.363485', 'Dart/3.9 (dart:io)', '102.88.110.69', NULL, NULL, NULL, NULL, NULL),
	('ab8305a7-3e40-4aaf-890e-4b3f68759bcc', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', '2026-05-04 08:58:16.088182+00', '2026-05-04 08:58:16.088182+00', NULL, 'aal1', NULL, NULL, 'Python-urllib/3.13', '102.88.110.69', NULL, NULL, NULL, NULL, NULL),
	('9148a31f-60d8-4aed-b3a9-bcdb5b728ccd', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', '2026-05-04 10:39:03.998896+00', '2026-05-04 10:39:03.998896+00', NULL, 'aal1', NULL, NULL, 'Python-urllib/3.13', '102.88.110.69', NULL, NULL, NULL, NULL, NULL),
	('2cb6662d-b36a-4456-90e6-4e777daa274e', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', '2026-05-04 13:28:50.44221+00', '2026-05-04 13:28:50.44221+00', NULL, 'aal1', NULL, NULL, 'Dart/3.9 (dart:io)', '102.91.71.85', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('462b83df-5d4f-4d4c-b1c6-8b27bd061243', '2026-04-22 11:19:59.657608+00', '2026-04-22 11:19:59.657608+00', 'password', 'c093312f-5285-46c6-8904-955ccc0f7f6d'),
	('aa1d540d-ab00-4e61-a2eb-d41be8386414', '2026-04-27 10:16:03.299679+00', '2026-04-27 10:16:03.299679+00', 'password', '56381569-331f-48cc-9f31-8c8ac6174d52'),
	('15aa1d7e-55f4-41cd-9448-557753aa1468', '2026-05-02 08:43:21.575076+00', '2026-05-02 08:43:21.575076+00', 'password', '5041aa62-1aeb-4d34-a565-73f834113f57'),
	('0c8a41ae-60c5-476c-88ea-82bda8e4a8b6', '2026-05-03 10:39:21.495238+00', '2026-05-03 10:39:21.495238+00', 'password', 'f4e6881a-5455-4a25-83a2-fc4ce4d342aa'),
	('ab8305a7-3e40-4aaf-890e-4b3f68759bcc', '2026-05-04 08:58:16.146271+00', '2026-05-04 08:58:16.146271+00', 'password', '71ff12d0-7693-4177-a383-f171cf743cb3'),
	('9148a31f-60d8-4aed-b3a9-bcdb5b728ccd', '2026-05-04 10:39:04.036239+00', '2026-05-04 10:39:04.036239+00', 'password', '079700f1-90eb-4b50-8e60-9da5f81f2c6c'),
	('2cb6662d-b36a-4456-90e6-4e777daa274e', '2026-05-04 13:28:50.503645+00', '2026-05-04 13:28:50.503645+00', 'password', '3f5d23f8-858d-4b59-81c8-4876c56769fd'),
	('da89a65c-8463-4a18-bd56-7eb4dc47ed79', '2026-05-04 14:37:45.809601+00', '2026-05-04 14:37:45.809601+00', 'otp', '1163100b-ca2d-408f-b4c7-1a553dfbe0ab');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") VALUES
	('0841ed94-98c1-4971-8662-89d13116bfcb', '4e191067-4c1f-434c-af6c-7b1541989891', 'recovery_token', 'pkce_a87432466f65f9524d2c13f8801c13d20d299c63d939587f07d54d1c', 'rhotex.exchange@gmail.com', '2026-05-03 10:39:21.949495', '2026-05-03 10:39:21.949495');


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 8, '2j44d7qkn53b', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', true, '2026-04-22 11:19:59.655405+00', '2026-04-22 12:19:22.268933+00', NULL, '462b83df-5d4f-4d4c-b1c6-8b27bd061243'),
	('00000000-0000-0000-0000-000000000000', 10, 'tcddk7bd4njt', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', false, '2026-04-27 10:16:03.260601+00', '2026-04-27 10:16:03.260601+00', NULL, 'aa1d540d-ab00-4e61-a2eb-d41be8386414'),
	('00000000-0000-0000-0000-000000000000', 9, 'flfsk6ig7jba', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', true, '2026-04-22 12:19:22.279488+00', '2026-05-02 06:52:04.508964+00', '2j44d7qkn53b', '462b83df-5d4f-4d4c-b1c6-8b27bd061243'),
	('00000000-0000-0000-0000-000000000000', 11, 'yl4glkbx5hxf', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', true, '2026-05-02 06:52:04.532148+00', '2026-05-02 08:42:19.280351+00', 'flfsk6ig7jba', '462b83df-5d4f-4d4c-b1c6-8b27bd061243'),
	('00000000-0000-0000-0000-000000000000', 13, 'yib3355nimn3', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-02 08:43:21.57275+00', '2026-05-02 09:42:48.51569+00', NULL, '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 12, '6ruzaod54l4n', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', true, '2026-05-02 08:42:19.292192+00', '2026-05-02 10:24:54.083278+00', 'yl4glkbx5hxf', '462b83df-5d4f-4d4c-b1c6-8b27bd061243'),
	('00000000-0000-0000-0000-000000000000', 14, 'jxo74qwxyekv', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-02 09:42:48.531559+00', '2026-05-02 10:42:18.411488+00', 'yib3355nimn3', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 16, 'bwylp4a4qgnu', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-02 10:42:18.42018+00', '2026-05-02 11:41:48.679717+00', 'jxo74qwxyekv', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 17, 'igl6wtrly2w4', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-02 11:41:48.70175+00', '2026-05-02 12:41:18.518716+00', 'bwylp4a4qgnu', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 18, 'i6k6xp626s5x', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-02 12:41:18.538548+00', '2026-05-02 13:40:48.536995+00', 'igl6wtrly2w4', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 19, 'nkhrf5yixyms', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-02 13:40:48.552095+00', '2026-05-02 14:40:18.609734+00', 'i6k6xp626s5x', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 20, 'vqhgs7kchrvl', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-02 14:40:18.62959+00', '2026-05-02 15:39:48.508364+00', 'nkhrf5yixyms', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 21, 'dde33xnkcgrn', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-02 15:39:48.521206+00', '2026-05-02 16:39:18.917976+00', 'vqhgs7kchrvl', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 22, 'vbkgvytw3uxx', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-02 16:39:18.929731+00', '2026-05-02 17:38:48.774405+00', 'dde33xnkcgrn', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 23, '2nausjqi6iwg', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-02 17:38:48.794704+00', '2026-05-02 18:38:18.583348+00', 'vbkgvytw3uxx', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 24, '4aef7a5joewv', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-02 18:38:18.599497+00', '2026-05-02 19:37:48.924749+00', '2nausjqi6iwg', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 25, 'ibikrwb5sxmu', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-02 19:37:48.944717+00', '2026-05-03 08:49:56.761855+00', '4aef7a5joewv', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 15, 'a2qu6wstdhof', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', true, '2026-05-02 10:24:54.10005+00', '2026-05-03 08:51:27.900997+00', '6ruzaod54l4n', '462b83df-5d4f-4d4c-b1c6-8b27bd061243'),
	('00000000-0000-0000-0000-000000000000', 27, 'i3ckjye4aptn', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-03 08:49:56.779618+00', '2026-05-03 09:49:26.495807+00', 'ibikrwb5sxmu', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 33, '2slmpg6fxfni', '4e191067-4c1f-434c-af6c-7b1541989891', false, '2026-05-03 10:39:21.493283+00', '2026-05-03 10:39:21.493283+00', NULL, '0c8a41ae-60c5-476c-88ea-82bda8e4a8b6'),
	('00000000-0000-0000-0000-000000000000', 31, 'avrpiz2wrfnf', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-03 09:49:26.511298+00', '2026-05-03 10:48:56.334449+00', 'i3ckjye4aptn', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 34, 'ol4xsd3mhwpx', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-03 10:48:56.34225+00', '2026-05-03 11:48:26.536634+00', 'avrpiz2wrfnf', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 35, 'lyithc7y3dwz', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-03 11:48:26.554262+00', '2026-05-03 12:47:56.372459+00', 'ol4xsd3mhwpx', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 36, '4eaosjzwij54', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-03 12:47:56.39185+00', '2026-05-03 13:47:26.357027+00', 'lyithc7y3dwz', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 37, 'xdp6x372agca', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-03 13:47:26.370881+00', '2026-05-03 14:46:56.696644+00', '4eaosjzwij54', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 38, 'tdbs63ugrpou', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-03 14:46:56.713057+00', '2026-05-03 15:46:26.265254+00', 'xdp6x372agca', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 39, 'z5smrxgogffw', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-03 15:46:26.285731+00', '2026-05-03 16:45:56.461827+00', 'tdbs63ugrpou', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 40, 'zjfyclkrzbzg', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-03 16:45:56.478397+00', '2026-05-03 17:45:26.384891+00', 'z5smrxgogffw', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 41, '4f5ocgsgebcp', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-03 17:45:26.398925+00', '2026-05-03 18:44:56.473362+00', 'zjfyclkrzbzg', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 42, '3jvcatoqvnni', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-03 18:44:56.501264+00', '2026-05-03 19:44:26.459354+00', '4f5ocgsgebcp', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 43, 'ts44uth5mgfo', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-03 19:44:26.47972+00', '2026-05-03 20:43:56.337789+00', '3jvcatoqvnni', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 44, 'ioevkkitnr6x', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-03 20:43:56.35139+00', '2026-05-03 21:43:26.460483+00', 'ts44uth5mgfo', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 45, 'ghg5qeykb7hv', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-03 21:43:26.472302+00', '2026-05-03 22:42:56.384148+00', 'ioevkkitnr6x', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 46, 'vaeafcnz3jfb', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-03 22:42:56.398333+00', '2026-05-03 23:42:26.670043+00', 'ghg5qeykb7hv', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 47, 'a6lbpn2g5zwz', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-03 23:42:26.690552+00', '2026-05-04 00:41:56.481018+00', 'vaeafcnz3jfb', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 48, 'yq6invunv6cf', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-04 00:41:56.50039+00', '2026-05-04 01:41:26.408432+00', 'a6lbpn2g5zwz', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 49, '6ovtmnpvpnyk', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-04 01:41:26.426495+00', '2026-05-04 02:40:56.50266+00', 'yq6invunv6cf', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 50, 'auv6o2ot72a3', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-04 02:40:56.518095+00', '2026-05-04 06:12:13.063152+00', '6ovtmnpvpnyk', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 51, 'ozculxbqleye', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-04 06:12:13.080917+00', '2026-05-04 07:11:36.695023+00', 'auv6o2ot72a3', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 52, 'n6jexa764y35', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', true, '2026-05-04 07:11:36.712464+00', '2026-05-04 08:11:06.333181+00', 'ozculxbqleye', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 53, '5gqc2y7t6uqj', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', false, '2026-05-04 08:11:06.342611+00', '2026-05-04 08:11:06.342611+00', 'n6jexa764y35', '15aa1d7e-55f4-41cd-9448-557753aa1468'),
	('00000000-0000-0000-0000-000000000000', 54, '2qgg5tdrmvjf', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', false, '2026-05-04 08:58:16.118171+00', '2026-05-04 08:58:16.118171+00', NULL, 'ab8305a7-3e40-4aaf-890e-4b3f68759bcc'),
	('00000000-0000-0000-0000-000000000000', 28, 'gdqbgd6zw6cb', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', true, '2026-05-03 08:51:27.909672+00', '2026-05-04 09:20:26.134416+00', 'a2qu6wstdhof', '462b83df-5d4f-4d4c-b1c6-8b27bd061243'),
	('00000000-0000-0000-0000-000000000000', 56, 'sknsqopzirld', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', false, '2026-05-04 10:39:04.017769+00', '2026-05-04 10:39:04.017769+00', NULL, '9148a31f-60d8-4aed-b3a9-bcdb5b728ccd'),
	('00000000-0000-0000-0000-000000000000', 57, 'ehhbdscq4is7', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', false, '2026-05-04 13:28:50.467831+00', '2026-05-04 13:28:50.467831+00', NULL, '2cb6662d-b36a-4456-90e6-4e777daa274e'),
	('00000000-0000-0000-0000-000000000000', 55, 'atnu3knbc4yj', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', true, '2026-05-04 09:20:26.140172+00', '2026-05-17 03:27:19.767817+00', 'gdqbgd6zw6cb', '462b83df-5d4f-4d4c-b1c6-8b27bd061243'),
	('00000000-0000-0000-0000-000000000000', 59, 'm336fulvownd', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', true, '2026-05-17 03:27:19.790995+00', '2026-05-17 11:43:02.052214+00', 'atnu3knbc4yj', '462b83df-5d4f-4d4c-b1c6-8b27bd061243'),
	('00000000-0000-0000-0000-000000000000', 60, 'f6ydrltso72m', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', true, '2026-05-17 11:43:02.074331+00', '2026-05-21 16:49:40.301187+00', 'm336fulvownd', '462b83df-5d4f-4d4c-b1c6-8b27bd061243'),
	('00000000-0000-0000-0000-000000000000', 61, '535iddbzwkdg', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', false, '2026-05-21 16:49:40.317145+00', '2026-05-21 16:49:40.317145+00', 'f6ydrltso72m', '462b83df-5d4f-4d4c-b1c6-8b27bd061243'),
	('00000000-0000-0000-0000-000000000000', 58, 'wjmlhijkl4ko', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', true, '2026-05-04 14:37:45.791704+00', '2026-06-10 13:08:27.767239+00', NULL, 'da89a65c-8463-4a18-bd56-7eb4dc47ed79'),
	('00000000-0000-0000-0000-000000000000', 62, 'onrpgerenxbx', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', true, '2026-06-10 13:08:27.772974+00', '2026-06-10 16:33:36.769086+00', 'wjmlhijkl4ko', 'da89a65c-8463-4a18-bd56-7eb4dc47ed79'),
	('00000000-0000-0000-0000-000000000000', 67, 'x5gieymbkfs4', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', true, '2026-06-10 16:33:36.776649+00', '2026-06-10 19:34:13.306226+00', 'onrpgerenxbx', 'da89a65c-8463-4a18-bd56-7eb4dc47ed79'),
	('00000000-0000-0000-0000-000000000000', 68, '55y2da55z3o7', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', true, '2026-06-10 19:34:13.320321+00', '2026-06-10 23:55:30.742217+00', 'x5gieymbkfs4', 'da89a65c-8463-4a18-bd56-7eb4dc47ed79'),
	('00000000-0000-0000-0000-000000000000', 69, 'iiatlg2qbhh5', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', false, '2026-06-10 23:55:30.757838+00', '2026-06-10 23:55:30.757838+00', '55y2da55z3o7', 'da89a65c-8463-4a18-bd56-7eb4dc47ed79');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "email", "phone", "full_name", "first_name", "last_name", "gender", "avatar_url", "role", "fcm_token", "created_at", "updated_at", "linked_auth_methods", "stripe_customer_id") VALUES
	('c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', 'jasonsaliu@gmail.com', '+2349017474218', 'Johnson eyitayo', '', '', 'Male', 'https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/public/avatars/c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c/avatar.jpg', 'user', NULL, '2026-04-22 11:19:59.320305+00', '2026-04-22 11:35:06.193173+00', '{email}', 'cus_UNkYNPXeTtZ1wb'),
	('5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', 'johnsonsaliu4real@gmail.com', '+2349018484210', 'EJ Test', '', '', 'Male', NULL, 'contractor', NULL, '2026-05-02 08:43:21.210365+00', '2026-05-02 08:43:48.074445+00', '{email}', NULL),
	('8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', 'oladunnirotimi13@gmail.com', '+2347075103141', 'Rotimi Oladunni', '', '', 'Male', NULL, 'contractor', NULL, '2026-05-03 08:58:56.401053+00', '2026-05-04 13:39:01.796075+00', '{email}', 'cus_USH7KAZhX22zDX'),
	('a8bd45b0-5413-44b2-aef2-6bd74478a8a3', 'oladunjoyeisabella@gmail.com', '+14378789167', 'Oluwanifemi oladunjoye', '', '', 'Female', NULL, 'contractor', NULL, '2026-05-02 22:19:54.860329+00', '2026-06-10 13:26:54.101587+00', '{email}', 'cus_USIHWaLsTh5sVF'),
	('8651a2dd-bd57-40c0-8584-2ce29a8ad760', 'maightoguy@gmail.com', '08087292952', 'Richard', 'Richard', 'Saliu', 'Male', NULL, 'admin', NULL, '2026-06-10 13:41:31.00257+00', '2026-06-10 13:44:51.771801+00', '{email}', NULL),
	('4e191067-4c1f-434c-af6c-7b1541989891', 'rhotex.exchange@gmail.com', '', '', '', '', NULL, NULL, 'admin', NULL, '2026-05-03 10:39:21.430543+00', '2026-06-11 07:16:49.980098+00', '{email}', NULL),
	('0a998373-8941-4ad7-b52a-2b697d3b2795', 'aidsprintsolutions@gmail.com', '', '', '', '', NULL, NULL, 'admin', NULL, '2026-06-11 07:19:12.592142+00', '2026-06-11 07:21:51.379595+00', '{email}', NULL);


--
-- Data for Name: service_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."service_categories" ("id", "name", "icon_key", "description", "display_order", "is_active", "min_hours", "created_at") VALUES
	('78508c6b-4d64-4259-8386-08c946d09741', 'Cleaning', 'cleaning', 'Professional cleaning services', 1, true, 2, '2026-04-21 20:32:46.750408+00'),
	('19354401-a43d-49ab-a010-36d6a0a45d76', 'PSW care', 'psw', 'Personal Support Worker services', 2, true, 2, '2026-04-21 20:32:46.750408+00'),
	('72c4c889-555e-4a31-bec9-4202c666a8b2', 'Plumbing', 'plumbing', 'Emergency and routine plumbing', 3, true, 1, '2026-04-21 20:32:46.750408+00'),
	('1472adde-6275-4a9a-94e6-dd5014f90603', 'Locksmith', 'locksmith', 'Lock and key services', 4, true, 1, '2026-04-21 20:32:46.750408+00'),
	('3c7723da-d3d6-4db7-9a24-5c09778a6ffb', 'Handyman', 'handyman', 'General home repair', 5, true, 1, '2026-04-21 20:32:46.750408+00'),
	('040b2388-1a1a-46d7-8f38-54e94356ec2e', 'Electrician', 'electrician', 'Electrical repair and installation', 6, true, 1, '2026-04-21 20:32:46.750408+00'),
	('006ce277-15c2-43e5-99ba-eaa2becfb9cf', 'Babysitting', 'babysitting', 'Childcare services', 7, true, 2, '2026-04-21 20:32:46.750408+00'),
	('47344656-7051-4214-9ad3-78cbb96b8b9e', 'Petsitter', 'petsitter', 'Pet care services', 8, true, 1, '2026-04-21 20:32:46.750408+00');


--
-- Data for Name: service_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."service_types" ("id", "category_id", "name", "base_price", "is_price_additional", "is_active", "created_at") VALUES
	('18d48a18-59e6-44b3-bd96-0d9654963ea2', '78508c6b-4d64-4259-8386-08c946d09741', 'Regular 1 bed', 35.00, false, true, '2026-04-21 20:32:46.750408+00'),
	('22bbd6ab-4715-4a59-8f0c-dd66807ea2e0', '78508c6b-4d64-4259-8386-08c946d09741', 'Regular 2 bed', 40.00, false, true, '2026-04-21 20:32:46.750408+00'),
	('eb9547a1-5783-4620-8458-af8cc1da4385', '78508c6b-4d64-4259-8386-08c946d09741', 'Regular 3+ bed', 45.00, false, true, '2026-04-21 20:32:46.750408+00'),
	('8cc4b9ed-5680-408f-8e6e-6b4fff4c306d', '78508c6b-4d64-4259-8386-08c946d09741', 'Deep 1 bed', 45.00, false, true, '2026-04-21 20:32:46.750408+00'),
	('07e84d3c-e124-4042-be7c-a7c53dfc4dfb', '78508c6b-4d64-4259-8386-08c946d09741', 'Deep 2 bed', 50.00, false, true, '2026-04-21 20:32:46.750408+00'),
	('ef7408f7-72cc-4db8-8d08-e9f2f5948387', '78508c6b-4d64-4259-8386-08c946d09741', 'Deep 3+ bed', 55.00, false, true, '2026-04-21 20:32:46.750408+00'),
	('a5343f1a-ce27-4241-a6db-69ae3c150119', '19354401-a43d-49ab-a010-36d6a0a45d76', 'PSW / Home Help', 35.00, false, true, '2026-04-21 20:32:46.750408+00'),
	('b802c8fb-942d-415b-84b8-aad6fdab6375', '72c4c889-555e-4a31-bec9-4202c666a8b2', 'Plumbing', 90.00, false, true, '2026-04-21 20:32:46.750408+00'),
	('30ca86a5-4057-4e3a-9b1b-7e8a9cc73172', '1472adde-6275-4a9a-94e6-dd5014f90603', 'Locksmith', 95.00, false, true, '2026-04-21 20:32:46.750408+00'),
	('9a657c09-dd19-4b60-a7ad-2cfc231f00a3', '3c7723da-d3d6-4db7-9a24-5c09778a6ffb', 'Handyman', 65.00, false, true, '2026-04-21 20:32:46.750408+00'),
	('2edca575-3ef7-4abb-93a6-9b0e541bf936', '040b2388-1a1a-46d7-8f38-54e94356ec2e', 'Electrician', 85.00, false, true, '2026-04-21 20:32:46.750408+00'),
	('67417da1-bb78-4b85-814b-07ef8f409ad6', '006ce277-15c2-43e5-99ba-eaa2becfb9cf', 'Babysitting', 30.00, false, true, '2026-04-21 20:32:46.750408+00'),
	('eadb0a80-2549-4796-8034-1b154fb55377', '47344656-7051-4214-9ad3-78cbb96b8b9e', 'Petsitter', 28.00, false, true, '2026-04-21 20:32:46.750408+00');


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."jobs" ("id", "user_id", "contractor_id", "service_category_id", "service_type_id", "service_type", "urgency_tier", "description", "hours", "base_price", "urgency_fee", "platform_fee", "price_estimate", "final_price", "status", "cancellation_reason", "cancelled_by", "latitude", "longitude", "address", "created_at", "updated_at", "accepted_at", "started_at", "completed_at", "cancelled_at") VALUES
	('57fa1513-c817-4823-aa8f-8ee309d52f82', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', NULL, NULL, NULL, 'Cleaning', 'standard', 'Hi

---ATTACHMENTS---
https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/57fa1513-c817-4823-aa8f-8ee309d52f82/6314.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvNTdmYTE1MTMtYzgxNy00ODIzLWFhOGYtOGVlMzA5ZDUyZjgyLzYzMTQuanBnIiwiaWF0IjoxNzc2ODU3NzAyLCJleHAiOjE4MDgzOTM3MDJ9.9Vi09lQZP6lQg_ZKhS1gX7lKP2s460MR_7GEmY7pKx8
https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/57fa1513-c817-4823-aa8f-8ee309d52f82/6462.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvNTdmYTE1MTMtYzgxNy00ODIzLWFhOGYtOGVlMzA5ZDUyZjgyLzY0NjIucG5nIiwiaWF0IjoxNzc2ODU3NzA0LCJleHAiOjE4MDgzOTM3MDR9.pBoU38rc2re4gVuPKF38aowdJL8iKmWagkvxDI4xmFc', 1, 55.00, 0.00, 4.99, 59.99, NULL, 'cancelled', 'Payment was not completed', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', 6.6660622, 3.239287, 'Ota, Ogun State, Nigeria', '2026-04-22 11:35:01.130911+00', '2026-04-22 11:39:14.017801+00', NULL, NULL, NULL, '2026-04-22 12:39:12.102683+00'),
	('649e1dce-5a36-45d4-9267-d7064af902d0', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', NULL, NULL, NULL, 'Cleaning', 'standard', 'Hello

---ATTACHMENTS---
https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/649e1dce-5a36-45d4-9267-d7064af902d0/6921.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvNjQ5ZTFkY2UtNWEzNi00NWQ0LTkyNjctZDcwNjRhZjkwMmQwLzY5MjEucG5nIiwiaWF0IjoxNzc2ODU5OTc4LCJleHAiOjE4MDgzOTU5Nzh9.feMZCLH1VQsoCOpvM0RyScCSSCLVwCwMWP7oLcBSByM
https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/649e1dce-5a36-45d4-9267-d7064af902d0/6946.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvNjQ5ZTFkY2UtNWEzNi00NWQ0LTkyNjctZDcwNjRhZjkwMmQwLzY5NDYucG5nIiwiaWF0IjoxNzc2ODU5OTgwLCJleHAiOjE4MDgzOTU5ODB9.4a8azamRp2d_WsM99XKC9T4lYBPib3kvX16gMakKMdY
https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/649e1dce-5a36-45d4-9267-d7064af902d0/6919.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvNjQ5ZTFkY2UtNWEzNi00NWQ0LTkyNjctZDcwNjRhZjkwMmQwLzY5MTkucG5nIiwiaWF0IjoxNzc2ODU5OTgwLCJleHAiOjE4MDgzOTU5ODB9.zOVTzUGMVRuGHneOft6imWJrGnRcx7Yup-3YXaokJ14', 1, 55.00, 0.00, 4.99, 59.99, NULL, 'cancelled', 'Cancelled by user', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', 6.6660604, 3.2392816, 'Ota, Ogun State, Nigeria', '2026-04-22 12:12:57.685651+00', '2026-04-22 12:19:03.90477+00', NULL, NULL, NULL, '2026-04-22 13:19:02.030266+00'),
	('3b1bd57f-68b6-49da-8998-f315166d0320', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', NULL, NULL, NULL, 'Cleaning', 'standard', 'Hello

---ATTACHMENTS---
https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/3b1bd57f-68b6-49da-8998-f315166d0320/6462.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvM2IxYmQ1N2YtNjhiNi00OWRhLTg5OTgtZjMxNTE2NmQwMzIwLzY0NjIucG5nIiwiaWF0IjoxNzc2ODU4NjUxLCJleHAiOjE4MDgzOTQ2NTF9.utH2ktIqih1NUG-aptQqFivtNt3jdOoDKTfY8RxDggw
https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/3b1bd57f-68b6-49da-8998-f315166d0320/5954.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvM2IxYmQ1N2YtNjhiNi00OWRhLTg5OTgtZjMxNTE2NmQwMzIwLzU5NTQuanBnIiwiaWF0IjoxNzc2ODU4NjUyLCJleHAiOjE4MDgzOTQ2NTJ9.tUog7siKs_AxKvq_2lsZKwMGOfEVXuPx9T8udZt7WLU', 1, 55.00, 0.00, 4.99, 59.99, NULL, 'cancelled', 'Payment was not completed', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', 6.666061, 3.23928, 'Ota, Ogun State, Nigeria', '2026-04-22 11:50:49.730322+00', '2026-04-22 11:51:00.152967+00', NULL, NULL, NULL, '2026-04-22 12:50:59.02101+00'),
	('14be789d-c4e6-4727-b2fb-00205b060ffd', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', NULL, NULL, NULL, 'Cleaning', 'standard', 'regular 1 bed

---ATTACHMENTS---
https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/14be789d-c4e6-4727-b2fb-00205b060ffd/1000062878.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvMTRiZTc4OWQtYzRlNi00NzI3LWIyZmItMDAyMDViMDYwZmZkLzEwMDAwNjI4NzguanBnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4MTEwOTUyNywiZXhwIjoxODEyNjQ1NTI3fQ.un9ilU4nN4rxEoVkaMLJ_t4OiaK3BOeIOmcf_qdQbVI', 2, 35.00, 0.00, 4.99, 74.99, NULL, 'cancelled', 'Payment was not completed', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', 43.7325054, -79.4479372, '30, Tretti Way, North York, Toronto, Ontario, Canada', '2026-06-10 16:38:46.394847+00', '2026-06-10 16:41:49.18596+00', NULL, NULL, NULL, '2026-06-10 12:41:49.028728+00'),
	('1a27d5ef-59d8-4db0-87eb-2509e7e8951f', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', NULL, NULL, NULL, 'Cleaning', 'standard', 'Hello

---ATTACHMENTS---
https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/1a27d5ef-59d8-4db0-87eb-2509e7e8951f/6921.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvMWEyN2Q1ZWYtNTlkOC00ZGIwLTg3ZWItMjUwOWU3ZTg5NTFmLzY5MjEucG5nIiwiaWF0IjoxNzc2ODU5MzY0LCJleHAiOjE4MDgzOTUzNjR9.ooKJ8T_fChxtjwgl0zEUwhJa-MfPFjbaa9MD-CmLUzE
https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/1a27d5ef-59d8-4db0-87eb-2509e7e8951f/6919.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvMWEyN2Q1ZWYtNTlkOC00ZGIwLTg3ZWItMjUwOWU3ZTg5NTFmLzY5MTkucG5nIiwiaWF0IjoxNzc2ODU5MzY1LCJleHAiOjE4MDgzOTUzNjV9.G80GrDNxrw5LSBfEQFc4nlqh2TwtoNmN5a1ewBPFi9I', 1, 55.00, 0.00, 4.99, 59.99, NULL, 'cancelled', 'Cancelled by user', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', 6.666061, 3.2392791, 'Ota, Ogun State, Nigeria', '2026-04-22 12:02:43.584507+00', '2026-04-27 10:16:35.306123+00', NULL, NULL, NULL, '2026-04-27 11:16:34.676771+00'),
	('1e4e47fc-44f0-47b3-b02d-716639262e96', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', NULL, NULL, NULL, 'Cleaning', 'standard', 'Hello

---ATTACHMENTS---
https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/1e4e47fc-44f0-47b3-b02d-716639262e96/6462.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvMWU0ZTQ3ZmMtNDRmMC00N2IzLWIwMmQtNzE2NjM5MjYyZTk2LzY0NjIucG5nIiwiaWF0IjoxNzc2ODU4NjcxLCJleHAiOjE4MDgzOTQ2NzF9.Qq0VT_5EawC4jZlt02nSegFfIp9rm44fIpKzRthYx-Y
https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/1e4e47fc-44f0-47b3-b02d-716639262e96/5954.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvMWU0ZTQ3ZmMtNDRmMC00N2IzLWIwMmQtNzE2NjM5MjYyZTk2LzU5NTQuanBnIiwiaWF0IjoxNzc2ODU4NjcyLCJleHAiOjE4MDgzOTQ2NzJ9.bDiOwf0oiEObCY7p34OMIJYHuyKNu4lUAzZ31WF4r_8', 1, 55.00, 0.00, 4.99, 59.99, NULL, 'cancelled', 'Cancelled by user', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', 6.666061, 3.23928, 'Ota, Ogun State, Nigeria', '2026-04-22 11:51:09.092137+00', '2026-04-27 10:16:41.794607+00', NULL, NULL, NULL, '2026-04-27 11:16:41.190954+00'),
	('935b55a6-b8e1-4941-aa2c-c5bcccaaffbb', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', NULL, NULL, 'Cleaning', 'standard', 'helloooojkjkjkkjk

---ATTACHMENTS---
https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/935b55a6-b8e1-4941-aa2c-c5bcccaaffbb/image_picker_FDDD3047-9EE6-4BCE-8A05-59E692437D7C-98185-000003FA039CCF89.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvOTM1YjU1YTYtYjhlMS00OTQxLWFhMmMtYzViY2NjYWFmZmJiL2ltYWdlX3BpY2tlcl9GREREMzA0Ny05RUU2LTRCQ0UtOEEwNS01OUU2OTI0MzdEN0MtOTgxODUtMDAwMDAzRkEwMzlDQ0Y4OS5qcGciLCJpYXQiOjE3NzcyODUyMjksImV4cCI6MTgwODgyMTIyOX0.H0aHuurHlnajFgxTdmRAAg-8sHcNm6OBhXHHZZjcoPQ
https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/935b55a6-b8e1-4941-aa2c-c5bcccaaffbb/image_picker_E6A0519E-58C2-4DBD-9C95-ACD86D17EDFD-98185-000003FA038D9245.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvOTM1YjU1YTYtYjhlMS00OTQxLWFhMmMtYzViY2NjYWFmZmJiL2ltYWdlX3BpY2tlcl9FNkEwNTE5RS01OEMyLTREQkQtOUM5NS1BQ0Q4NkQxN0VERkQtOTgxODUtMDAwMDAzRkEwMzhEOTI0NS5qcGciLCJpYXQiOjE3NzcyODUyMzAsImV4cCI6MTgwODgyMTIzMH0.80SnyWT0HhPxt-xeUcJGvLY9lXbb7w4oT_lTktUExco', 2, 55.00, 0.00, 4.99, 114.99, NULL, 'contractor_en_route', NULL, NULL, 6.60656, 3.30235, 'Alhaji Idowu Street, Alimosho, Lagos, Nigeria', '2026-04-27 10:20:28.642909+00', '2026-05-03 08:53:14.673023+00', '2026-05-03 08:51:53.975644+00', NULL, NULL, NULL),
	('3eb8b60f-4b6f-4130-87d4-9afa40efcd9e', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', NULL, NULL, NULL, 'Cleaning', 'standard', 'Dual-role policy repro after fix', 1, 35.00, 0.00, 5.00, 40.00, NULL, 'requested', NULL, NULL, 9.0765, 7.3986, 'Abuja, Nigeria', '2026-05-04 10:39:05.031899+00', '2026-05-04 10:39:05.031899+00', NULL, NULL, NULL, NULL),
	('38696ae4-4fd6-4628-80f2-a64103fda858', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', NULL, NULL, NULL, 'Cleaning', 'urgent', 'hsbdjsksk

---ATTACHMENTS---
https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/38696ae4-4fd6-4628-80f2-a64103fda858/41288.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvMzg2OTZhZTQtNGZkNi00NjI4LTgwZjItYTY0MTAzZmRhODU4LzQxMjg4LmpwZyIsImlhdCI6MTc3NzkwMTQwMCwiZXhwIjoxODA5NDM3NDAwfQ.f1saN9PYKkjhOwRp9_eNNzOlX-TbFPD-dqwZwXavEdQ', 2, 35.00, 15.00, 4.99, 89.99, NULL, 'broadcast', NULL, NULL, 9.1496934, 7.3494228, '587, Abadam Close, Abuja, Federal Capital Territory, Nigeria', '2026-05-04 13:29:58.704274+00', '2026-05-04 13:38:11.579988+00', NULL, NULL, NULL, NULL),
	('1bdedffe-8a37-4f52-a775-9862289073cd', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', NULL, NULL, NULL, 'Cleaning', 'urgent', 'regular cleaning

---ATTACHMENTS---
https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/1bdedffe-8a37-4f52-a775-9862289073cd/1000064416.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvMWJkZWRmZmUtOGEzNy00ZjUyLWE3NzUtOTg2MjI4OTA3M2NkLzEwMDAwNjQ0MTYuanBnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4MTA5Nzc1MiwiZXhwIjoxODEyNjMzNzUyfQ.9BZ-57AZuegg22tA2ZdoqTSjuOmlr6Fpu6kaQRP22lA', 2, 55.00, 15.00, 4.99, 129.99, NULL, 'cancelled', 'Payment was not completed', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', 43.7325054, -79.4479372, '30, Tretti Way, North York, Toronto, Ontario, Canada', '2026-06-10 13:22:31.333577+00', '2026-06-10 13:24:18.31419+00', NULL, NULL, NULL, '2026-06-10 09:24:18.176814+00'),
	('bf7b49a3-ef5f-46ab-8f2e-3f83262e2392', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', NULL, NULL, NULL, 'Cleaning', 'urgent', 'regular cleaning 1bedroom

---ATTACHMENTS---
https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/bf7b49a3-ef5f-46ab-8f2e-3f83262e2392/1000049340.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvYmY3YjQ5YTMtZWY1Zi00NmFiLThmMmUtM2Y4MzI2MmUyMzkyLzEwMDAwNDkzNDAuanBnIiwiaWF0IjoxNzc3OTA1NzIzLCJleHAiOjE4MDk0NDE3MjN9.P14sDe0JNJdo96sQ8ZD1NNfKbXKEfirlSD4RSrXyNWg', 1, 35.00, 15.00, 4.99, 54.99, NULL, 'cancelled', 'Payment was not completed', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', 43.8369797, -79.0031297, '24, Rollo Drive, Ajax, Ontario, Canada', '2026-05-04 14:42:02.301183+00', '2026-05-04 14:50:42.301838+00', NULL, NULL, NULL, '2026-05-04 10:50:41.857573+00'),
	('6bef9d24-3e10-4cfe-8c73-0ce6bb4c88eb', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', NULL, NULL, NULL, 'PSW care', 'standard', 'psw care for mother

---ATTACHMENTS---
https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/6bef9d24-3e10-4cfe-8c73-0ce6bb4c88eb/1000049144.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvNmJlZjlkMjQtM2UxMC00Y2ZlLThjNzMtMGNlNmJiNGM4OGViLzEwMDAwNDkxNDQuanBnIiwiaWF0IjoxNzc3OTA2NjkyLCJleHAiOjE4MDk0NDI2OTJ9.6JlCr16129ND0BqigOY-YtRMGHL5s763RzeRXwrHmro', 2, 35.00, 0.00, 4.99, 74.99, NULL, 'broadcast', NULL, NULL, 43.8369797, -79.0031297, '24, Rollo Drive, Ajax, Ontario, Canada', '2026-05-04 14:58:11.362686+00', '2026-05-04 14:58:49.989672+00', NULL, NULL, NULL, NULL),
	('1efa1f01-59e5-4428-9e31-4222898768d5', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', NULL, NULL, NULL, 'PSW care', 'standard', 'psw care for mother

---ATTACHMENTS---
https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/1efa1f01-59e5-4428-9e31-4222898768d5/1000049144.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvMWVmYTFmMDEtNTllNS00NDI4LTllMzEtNDIyMjg5ODc2OGQ1LzEwMDAwNDkxNDQuanBnIiwiaWF0IjoxNzc3OTA2MzE3LCJleHAiOjE4MDk0NDIzMTd9.HelTIMixsx2eN8mxMD1oyxyMcTxTY_B3cuzCXWV_jyU', 2, 35.00, 0.00, 4.99, 74.99, NULL, 'cancelled', 'Payment was not completed', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', 43.8369797, -79.0031297, '24, Rollo Drive, Ajax, Ontario, Canada', '2026-05-04 14:51:56.41918+00', '2026-05-04 14:53:42.816408+00', NULL, NULL, NULL, '2026-05-04 10:53:42.379884+00');


--
-- Data for Name: chat_conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: contractors; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."contractors" ("id", "services", "certifications", "rating", "total_ratings", "acceptance_rate", "total_jobs_offered", "total_jobs_accepted", "availability_status", "current_latitude", "current_longitude", "location_updated_at", "is_verified", "id_verification_complete", "police_check_complete", "service_licences_complete", "created_at", "updated_at", "stripe_account_id", "stripe_onboarding_completed", "stripe_charges_enabled", "stripe_payouts_enabled", "payouts_blocked_reason") VALUES
	('5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', '{Cleaning}', '{}', 0.00, 0, 1.0000, 1, 1, 'offline', 6.60656, 3.30235, '2026-05-03 09:52:24.448187+00', true, true, true, true, '2026-05-02 08:43:48.074445+00', '2026-05-03 08:52:25.33502+00', NULL, false, false, false, NULL),
	('8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', '{Cleaning}', '{}', 0.00, 0, 0.0000, 0, 0, 'pending_approval', NULL, NULL, NULL, true, true, true, true, '2026-05-03 09:01:26.928713+00', '2026-05-03 09:02:41.403838+00', NULL, false, false, false, NULL),
	('4e191067-4c1f-434c-af6c-7b1541989891', '{}', '{}', 0.00, 0, 0.0000, 0, 0, 'offline', NULL, NULL, NULL, false, false, false, false, '2026-06-05 13:09:59.123135+00', '2026-06-05 13:09:59.123135+00', NULL, false, false, false, NULL),
	('a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '{"PSW care"}', '{}', 0.00, 0, 0.0000, 0, 0, 'pending_approval', NULL, NULL, NULL, true, true, true, true, '2026-05-04 14:54:37.571099+00', '2026-06-10 16:33:39.894465+00', 'acct_1TTNvQDmd23WvYQj', false, false, false, 'requirements.past_due');


--
-- Data for Name: contractor_bank_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: contractor_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."contractor_documents" ("id", "contractor_id", "document_type", "storage_path", "file_name", "mime_type", "status", "reviewed_at", "reviewed_by", "rejection_reason", "created_at") VALUES
	('1950ae44-02cb-4758-8490-d03df1ba62ea', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', 'passport', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb/passport/1777711467361_image_picker_EEE9E4EC-1D3E-4967-B53E-3664CFF7930E-49665-000001F126BBFFC3.jpg', 'image_picker_EEE9E4EC-1D3E-4967-B53E-3664CFF7930E-49665-000001F126BBFFC3.jpg', 'image/jpeg', 'pending', NULL, NULL, NULL, '2026-05-02 08:44:37.801831+00'),
	('c24a97da-c543-43ad-ae2f-32f790a29f32', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', 'police_check', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb/police_check/1777711489207_image_picker_EF919A3D-59CB-4C9E-ABEB-64694D285240-49665-000001F15E3C79F0.jpg', 'image_picker_EF919A3D-59CB-4C9E-ABEB-64694D285240-49665-000001F15E3C79F0.jpg', 'image/jpeg', 'pending', NULL, NULL, NULL, '2026-05-02 08:44:54.604952+00'),
	('321cfb0b-de41-45c7-91ac-7a4bd98f0618', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', 'service_licence', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb/service_licence/1777711513876_image_picker_87D688C4-D4D6-4458-BEB4-D73595A4370C-49665-000001F17D1F9073.jpg', 'image_picker_87D688C4-D4D6-4458-BEB4-D73595A4370C-49665-000001F17D1F9073.jpg', 'image/jpeg', 'pending', NULL, NULL, NULL, '2026-05-02 08:45:17.302329+00'),
	('1b0a6949-8fc4-4cf9-8e47-d23bf4064fde', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', 'government_id', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa/government_id/1777798919215_scaled_41288.jpg', 'scaled_41288.jpg', 'image/jpeg', 'pending', NULL, NULL, NULL, '2026-05-03 09:02:00.825315+00'),
	('929bdf87-5227-4a92-ac89-bc877fedecee', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', 'police_check', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa/police_check/1777798928119_scaled_41303.jpg', 'scaled_41303.jpg', 'image/jpeg', 'pending', NULL, NULL, NULL, '2026-05-03 09:02:08.89214+00'),
	('fd5fb919-f527-436b-bd3e-ed3afc7e2585', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', 'service_licence', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa/service_licence/1777798959417_scaled_37822.jpg', 'scaled_37822.jpg', 'image/jpeg', 'pending', NULL, NULL, NULL, '2026-05-03 09:02:40.887934+00'),
	('7bacb9a7-1c72-4eb7-a5e3-10d16c6d6443', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', 'drivers_licence', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3/drivers_licence/1777906531163_scaled_1000049340.jpg', 'scaled_1000049340.jpg', 'image/jpeg', 'pending', NULL, NULL, NULL, '2026-05-04 14:55:32.310304+00'),
	('7e2330f0-818a-4c61-a698-51b385213c73', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', 'police_check', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3/police_check/1777906538359_scaled_1000049332.jpg', 'scaled_1000049332.jpg', 'image/jpeg', 'pending', NULL, NULL, NULL, '2026-05-04 14:55:39.2378+00'),
	('2a704a05-f9ab-40d5-956e-535514b6845c', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', 'service_licence', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3/service_licence/1777906562153_scaled_1000048772.jpg', 'scaled_1000048772.jpg', 'image/jpeg', 'pending', NULL, NULL, NULL, '2026-05-04 14:56:03.201433+00');


--
-- Data for Name: job_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."job_attachments" ("id", "job_id", "storage_path", "file_name", "mime_type", "uploaded_by", "created_at") VALUES
	('51e7dc0d-dacf-4c97-91d6-17c595bfdef0', '57fa1513-c817-4823-aa8f-8ee309d52f82', 'https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/57fa1513-c817-4823-aa8f-8ee309d52f82/6314.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvNTdmYTE1MTMtYzgxNy00ODIzLWFhOGYtOGVlMzA5ZDUyZjgyLzYzMTQuanBnIiwiaWF0IjoxNzc2ODU3NzAyLCJleHAiOjE4MDgzOTM3MDJ9.9Vi09lQZP6lQg_ZKhS1gX7lKP2s460MR_7GEmY7pKx8', '6314.jpg', '', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 11:35:02.579107+00'),
	('cef6e6a8-cb16-4bb7-99ba-3542ef088ca8', '57fa1513-c817-4823-aa8f-8ee309d52f82', 'https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/57fa1513-c817-4823-aa8f-8ee309d52f82/6462.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvNTdmYTE1MTMtYzgxNy00ODIzLWFhOGYtOGVlMzA5ZDUyZjgyLzY0NjIucG5nIiwiaWF0IjoxNzc2ODU3NzA0LCJleHAiOjE4MDgzOTM3MDR9.pBoU38rc2re4gVuPKF38aowdJL8iKmWagkvxDI4xmFc', '6462.png', '', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 11:35:04.225845+00'),
	('ded4cd9f-770b-4afb-8408-da8c7569b36b', '3b1bd57f-68b6-49da-8998-f315166d0320', 'https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/3b1bd57f-68b6-49da-8998-f315166d0320/6462.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvM2IxYmQ1N2YtNjhiNi00OWRhLTg5OTgtZjMxNTE2NmQwMzIwLzY0NjIucG5nIiwiaWF0IjoxNzc2ODU4NjUxLCJleHAiOjE4MDgzOTQ2NTF9.utH2ktIqih1NUG-aptQqFivtNt3jdOoDKTfY8RxDggw', '6462.png', '', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 11:50:52.12988+00'),
	('402a67b3-ade3-402c-84c8-0cfad04902d1', '3b1bd57f-68b6-49da-8998-f315166d0320', 'https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/3b1bd57f-68b6-49da-8998-f315166d0320/5954.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvM2IxYmQ1N2YtNjhiNi00OWRhLTg5OTgtZjMxNTE2NmQwMzIwLzU5NTQuanBnIiwiaWF0IjoxNzc2ODU4NjUyLCJleHAiOjE4MDgzOTQ2NTJ9.tUog7siKs_AxKvq_2lsZKwMGOfEVXuPx9T8udZt7WLU', '5954.jpg', '', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 11:50:52.968353+00'),
	('d598d815-fdf6-4e0e-ac90-a3b40bff03c2', '1e4e47fc-44f0-47b3-b02d-716639262e96', 'https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/1e4e47fc-44f0-47b3-b02d-716639262e96/6462.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvMWU0ZTQ3ZmMtNDRmMC00N2IzLWIwMmQtNzE2NjM5MjYyZTk2LzY0NjIucG5nIiwiaWF0IjoxNzc2ODU4NjcxLCJleHAiOjE4MDgzOTQ2NzF9.Qq0VT_5EawC4jZlt02nSegFfIp9rm44fIpKzRthYx-Y', '6462.png', '', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 11:51:11.503455+00'),
	('6f815686-9035-4b4f-9964-21462e53e4fc', '1e4e47fc-44f0-47b3-b02d-716639262e96', 'https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/1e4e47fc-44f0-47b3-b02d-716639262e96/5954.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvMWU0ZTQ3ZmMtNDRmMC00N2IzLWIwMmQtNzE2NjM5MjYyZTk2LzU5NTQuanBnIiwiaWF0IjoxNzc2ODU4NjcyLCJleHAiOjE4MDgzOTQ2NzJ9.bDiOwf0oiEObCY7p34OMIJYHuyKNu4lUAzZ31WF4r_8', '5954.jpg', '', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 11:51:12.35496+00'),
	('f2e7aa97-e783-444a-9f74-45ed62bd7565', '1a27d5ef-59d8-4db0-87eb-2509e7e8951f', 'https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/1a27d5ef-59d8-4db0-87eb-2509e7e8951f/6921.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvMWEyN2Q1ZWYtNTlkOC00ZGIwLTg3ZWItMjUwOWU3ZTg5NTFmLzY5MjEucG5nIiwiaWF0IjoxNzc2ODU5MzY0LCJleHAiOjE4MDgzOTUzNjR9.ooKJ8T_fChxtjwgl0zEUwhJa-MfPFjbaa9MD-CmLUzE', '6921.png', '', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 12:02:44.809439+00'),
	('d94a24b3-bce1-4e0d-adc2-70fa8bfb9f9d', '1a27d5ef-59d8-4db0-87eb-2509e7e8951f', 'https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/1a27d5ef-59d8-4db0-87eb-2509e7e8951f/6919.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvMWEyN2Q1ZWYtNTlkOC00ZGIwLTg3ZWItMjUwOWU3ZTg5NTFmLzY5MTkucG5nIiwiaWF0IjoxNzc2ODU5MzY1LCJleHAiOjE4MDgzOTUzNjV9.G80GrDNxrw5LSBfEQFc4nlqh2TwtoNmN5a1ewBPFi9I', '6919.png', '', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 12:02:46.050847+00'),
	('e423060a-45e0-4a5f-8636-3102fa0e15a0', '649e1dce-5a36-45d4-9267-d7064af902d0', 'https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/649e1dce-5a36-45d4-9267-d7064af902d0/6921.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvNjQ5ZTFkY2UtNWEzNi00NWQ0LTkyNjctZDcwNjRhZjkwMmQwLzY5MjEucG5nIiwiaWF0IjoxNzc2ODU5OTc4LCJleHAiOjE4MDgzOTU5Nzh9.feMZCLH1VQsoCOpvM0RyScCSSCLVwCwMWP7oLcBSByM', '6921.png', '', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 12:12:59.065492+00'),
	('4c454399-5075-49b9-9981-9b3f03ec91f7', '649e1dce-5a36-45d4-9267-d7064af902d0', 'https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/649e1dce-5a36-45d4-9267-d7064af902d0/6946.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvNjQ5ZTFkY2UtNWEzNi00NWQ0LTkyNjctZDcwNjRhZjkwMmQwLzY5NDYucG5nIiwiaWF0IjoxNzc2ODU5OTgwLCJleHAiOjE4MDgzOTU5ODB9.4a8azamRp2d_WsM99XKC9T4lYBPib3kvX16gMakKMdY', '6946.png', '', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 12:13:00.225961+00'),
	('422b8318-5e09-4f0e-9f89-0979ed953ec3', '649e1dce-5a36-45d4-9267-d7064af902d0', 'https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/649e1dce-5a36-45d4-9267-d7064af902d0/6919.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvNjQ5ZTFkY2UtNWEzNi00NWQ0LTkyNjctZDcwNjRhZjkwMmQwLzY5MTkucG5nIiwiaWF0IjoxNzc2ODU5OTgwLCJleHAiOjE4MDgzOTU5ODB9.zOVTzUGMVRuGHneOft6imWJrGnRcx7Yup-3YXaokJ14', '6919.png', '', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 12:13:01.103025+00'),
	('c4f5f290-39e2-4210-a738-504db4b993c3', '935b55a6-b8e1-4941-aa2c-c5bcccaaffbb', 'https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/935b55a6-b8e1-4941-aa2c-c5bcccaaffbb/image_picker_FDDD3047-9EE6-4BCE-8A05-59E692437D7C-98185-000003FA039CCF89.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvOTM1YjU1YTYtYjhlMS00OTQxLWFhMmMtYzViY2NjYWFmZmJiL2ltYWdlX3BpY2tlcl9GREREMzA0Ny05RUU2LTRCQ0UtOEEwNS01OUU2OTI0MzdEN0MtOTgxODUtMDAwMDAzRkEwMzlDQ0Y4OS5qcGciLCJpYXQiOjE3NzcyODUyMjksImV4cCI6MTgwODgyMTIyOX0.H0aHuurHlnajFgxTdmRAAg-8sHcNm6OBhXHHZZjcoPQ', 'image_picker_FDDD3047-9EE6-4BCE-8A05-59E692437D7C-98185-000003FA039CCF89.jpg', '', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-27 10:20:29.689217+00'),
	('cbaa6224-d7ef-4d40-bff8-9a76919c5c13', '935b55a6-b8e1-4941-aa2c-c5bcccaaffbb', 'https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/935b55a6-b8e1-4941-aa2c-c5bcccaaffbb/image_picker_E6A0519E-58C2-4DBD-9C95-ACD86D17EDFD-98185-000003FA038D9245.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvOTM1YjU1YTYtYjhlMS00OTQxLWFhMmMtYzViY2NjYWFmZmJiL2ltYWdlX3BpY2tlcl9FNkEwNTE5RS01OEMyLTREQkQtOUM5NS1BQ0Q4NkQxN0VERkQtOTgxODUtMDAwMDAzRkEwMzhEOTI0NS5qcGciLCJpYXQiOjE3NzcyODUyMzAsImV4cCI6MTgwODgyMTIzMH0.80SnyWT0HhPxt-xeUcJGvLY9lXbb7w4oT_lTktUExco', 'image_picker_E6A0519E-58C2-4DBD-9C95-ACD86D17EDFD-98185-000003FA038D9245.jpg', '', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-27 10:20:30.810095+00'),
	('d72a5d07-c74d-4d66-8936-eff9129c41e1', '38696ae4-4fd6-4628-80f2-a64103fda858', 'https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/38696ae4-4fd6-4628-80f2-a64103fda858/41288.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvMzg2OTZhZTQtNGZkNi00NjI4LTgwZjItYTY0MTAzZmRhODU4LzQxMjg4LmpwZyIsImlhdCI6MTc3NzkwMTQwMCwiZXhwIjoxODA5NDM3NDAwfQ.f1saN9PYKkjhOwRp9_eNNzOlX-TbFPD-dqwZwXavEdQ', '41288.jpg', '', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', '2026-05-04 13:30:00.502484+00'),
	('8c2a56ef-8fb6-4a01-af80-a311c2d69346', 'bf7b49a3-ef5f-46ab-8f2e-3f83262e2392', 'https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/bf7b49a3-ef5f-46ab-8f2e-3f83262e2392/1000049340.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvYmY3YjQ5YTMtZWY1Zi00NmFiLThmMmUtM2Y4MzI2MmUyMzkyLzEwMDAwNDkzNDAuanBnIiwiaWF0IjoxNzc3OTA1NzIzLCJleHAiOjE4MDk0NDE3MjN9.P14sDe0JNJdo96sQ8ZD1NNfKbXKEfirlSD4RSrXyNWg', '1000049340.jpg', '', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '2026-05-04 14:42:03.212202+00'),
	('d1319c19-fa0b-4b7d-98fb-e932a06fc15b', '1efa1f01-59e5-4428-9e31-4222898768d5', 'https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/1efa1f01-59e5-4428-9e31-4222898768d5/1000049144.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvMWVmYTFmMDEtNTllNS00NDI4LTllMzEtNDIyMjg5ODc2OGQ1LzEwMDAwNDkxNDQuanBnIiwiaWF0IjoxNzc3OTA2MzE3LCJleHAiOjE4MDk0NDIzMTd9.HelTIMixsx2eN8mxMD1oyxyMcTxTY_B3cuzCXWV_jyU', '1000049144.jpg', '', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '2026-05-04 14:51:57.655243+00'),
	('2a9a58b8-be95-4aa1-ae50-110f5265f736', '6bef9d24-3e10-4cfe-8c73-0ce6bb4c88eb', 'https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/6bef9d24-3e10-4cfe-8c73-0ce6bb4c88eb/1000049144.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvNmJlZjlkMjQtM2UxMC00Y2ZlLThjNzMtMGNlNmJiNGM4OGViLzEwMDAwNDkxNDQuanBnIiwiaWF0IjoxNzc3OTA2NjkyLCJleHAiOjE4MDk0NDI2OTJ9.6JlCr16129ND0BqigOY-YtRMGHL5s763RzeRXwrHmro', '1000049144.jpg', '', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '2026-05-04 14:58:12.224014+00'),
	('92c193eb-69ef-4510-9eb0-22f81bd7b083', '1bdedffe-8a37-4f52-a775-9862289073cd', 'https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/1bdedffe-8a37-4f52-a775-9862289073cd/1000064416.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvMWJkZWRmZmUtOGEzNy00ZjUyLWE3NzUtOTg2MjI4OTA3M2NkLzEwMDAwNjQ0MTYuanBnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4MTA5Nzc1MiwiZXhwIjoxODEyNjMzNzUyfQ.9BZ-57AZuegg22tA2ZdoqTSjuOmlr6Fpu6kaQRP22lA', '1000064416.jpg', '', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '2026-06-10 13:22:32.486322+00'),
	('346736c4-b4ec-47d1-ba5c-76fee36cdb57', '14be789d-c4e6-4727-b2fb-00205b060ffd', 'https://rtsotxoqcevlljmzsomn.supabase.co/storage/v1/object/sign/job-attachments/14be789d-c4e6-4727-b2fb-00205b060ffd/1000062878.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGYwZTNlMi0xZDQ5LTQ4NjktYjFkOS1hNDUwMGJjMTczMTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJqb2ItYXR0YWNobWVudHMvMTRiZTc4OWQtYzRlNi00NzI3LWIyZmItMDAyMDViMDYwZmZkLzEwMDAwNjI4NzguanBnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4MTEwOTUyNywiZXhwIjoxODEyNjQ1NTI3fQ.un9ilU4nN4rxEoVkaMLJ_t4OiaK3BOeIOmcf_qdQbVI', '1000062878.jpg', '', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '2026-06-10 16:38:47.353049+00');


--
-- Data for Name: job_declined_contractors; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."payments" ("id", "job_id", "payer_id", "payee_id", "amount", "platform_fee", "contractor_payout", "status", "stripe_payment_intent_id", "stripe_transfer_id", "created_at", "updated_at", "currency", "capture_method", "stripe_charge_id", "stripe_application_fee_amount", "captured_at", "refunded_at") VALUES
	('1987f5cc-a127-4cec-8ecd-6850cbdb915e', '57fa1513-c817-4823-aa8f-8ee309d52f82', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', NULL, 59.99, 4.99, 38.50, 'pending', 'pi_3TOz3eDDDBrR6gkV0i1lc2XE', NULL, '2026-04-22 11:35:06.629911+00', '2026-04-22 11:35:06.629911+00', 'usd', 'manual', NULL, NULL, NULL, NULL),
	('9f6e5347-012c-4310-b917-75f38f0ec673', '3b1bd57f-68b6-49da-8998-f315166d0320', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', NULL, 59.99, 4.99, 38.50, 'pending', 'pi_3TOzIwDDDBrR6gkV1ZRiPF87', NULL, '2026-04-22 11:50:54.441403+00', '2026-04-22 11:50:54.441403+00', 'usd', 'manual', NULL, NULL, NULL, NULL),
	('ec8b9ab4-a5b9-469b-a4be-d300bf1029d9', '649e1dce-5a36-45d4-9267-d7064af902d0', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', NULL, 59.99, 4.99, 38.50, 'refunded', 'pi_3TOzeMDDDBrR6gkV1Zr4IVRF', NULL, '2026-04-22 12:13:03.005135+00', '2026-04-22 12:19:07.057463+00', 'usd', 'manual', 'ch_3TOzeMDDDBrR6gkV1RRnOXvj', NULL, NULL, '2026-04-22 12:19:06.536+00'),
	('6d41dd9f-2797-4e09-8e8e-0787a6149f45', '1a27d5ef-59d8-4db0-87eb-2509e7e8951f', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', NULL, 59.99, 4.99, 38.50, 'cancelled', 'pi_3TOzURDDDBrR6gkV0GqkkIPk', NULL, '2026-04-22 12:02:47.56789+00', '2026-04-27 10:16:37.536435+00', 'usd', 'manual', NULL, NULL, NULL, NULL),
	('05bd6fac-2cfe-4511-9185-3c70789ce5e1', '1e4e47fc-44f0-47b3-b02d-716639262e96', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', NULL, 59.99, 4.99, 38.50, 'cancelled', 'pi_3TOzJFDDDBrR6gkV0g9CwSt1', NULL, '2026-04-22 11:51:13.559064+00', '2026-04-27 10:16:43.473948+00', 'usd', 'manual', NULL, NULL, NULL, NULL),
	('4232133f-9ff2-4008-bbcb-62452afec68b', '935b55a6-b8e1-4941-aa2c-c5bcccaaffbb', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', 114.99, 4.99, 77.00, 'captured', 'pi_3TQmHEDDDBrR6gkV1EwVhx9K', NULL, '2026-04-27 10:20:32.526599+00', '2026-05-03 08:51:56.558108+00', 'usd', 'manual', 'ch_3TQmHEDDDBrR6gkV1QWgIYT2', NULL, '2026-05-03 08:51:56.523+00', NULL),
	('fa372224-d961-42bb-a31b-63b36e9fc27c', 'bf7b49a3-ef5f-46ab-8f2e-3f83262e2392', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', NULL, 54.99, 4.99, 32.50, 'pending', 'pi_3TTNhBDDDBrR6gkV1LJFCnXS', NULL, '2026-05-04 14:42:06.180821+00', '2026-05-04 14:42:06.180821+00', 'usd', 'manual', NULL, NULL, NULL, NULL),
	('d7eae3da-55a6-4cfa-ba6e-6e38a8f83dde', '1efa1f01-59e5-4428-9e31-4222898768d5', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', NULL, 74.99, 4.99, 49.00, 'failed', 'pi_3TTNqlDDDBrR6gkV0RXLcSRw', NULL, '2026-05-04 14:51:59.553863+00', '2026-05-04 14:53:23.027931+00', 'usd', 'manual', NULL, NULL, NULL, NULL),
	('2128f818-9fc3-457c-82b3-602c0cb14b79', '38696ae4-4fd6-4628-80f2-a64103fda858', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', NULL, 89.99, 4.99, 55.25, 'cancelled', 'pi_3TTMZTDDDBrR6gkV0HjmMypF', NULL, '2026-05-04 13:30:03.60618+00', '2026-05-11 13:38:12.196207+00', 'usd', 'manual', NULL, NULL, NULL, NULL),
	('835ed97e-957a-4fc5-9b3d-57940e953d87', '6bef9d24-3e10-4cfe-8c73-0ce6bb4c88eb', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', NULL, 74.99, 4.99, 49.00, 'cancelled', 'pi_3TTNwnDDDBrR6gkV1NT3nYZP', NULL, '2026-05-04 14:58:13.489434+00', '2026-05-11 14:58:51.17483+00', 'usd', 'manual', NULL, NULL, NULL, NULL),
	('6ea64d66-f128-4112-acb2-6e34608ef600', '1bdedffe-8a37-4f52-a775-9862289073cd', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', NULL, 129.99, 4.99, 81.25, 'pending', 'pi_3Tgm5WDDDBrR6gkV0fz1TrGg', NULL, '2026-06-10 13:22:34.51996+00', '2026-06-10 13:22:34.51996+00', 'usd', 'manual', NULL, NULL, NULL, NULL),
	('149dbeb3-80da-4d44-9ed4-dbbc1750bd18', '14be789d-c4e6-4727-b2fb-00205b060ffd', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', NULL, 74.99, 4.99, 49.00, 'pending', 'pi_3Tgp9QDDDBrR6gkV0f95pvgt', NULL, '2026-06-10 16:38:49.105607+00', '2026-06-10 16:38:49.105607+00', 'usd', 'manual', NULL, NULL, NULL, NULL);


--
-- Data for Name: platform_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."platform_config" ("key", "value", "description", "updated_at") VALUES
	('platform_fee', '4.99', 'Fixed platform fee charged per job in USD', '2026-04-21 20:32:46.750408+00'),
	('currency', 'USD', 'Default currency for all transactions', '2026-04-21 20:32:46.750408+00');


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: urgency_tiers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."urgency_tiers" ("id", "name", "label", "description", "extra_fee", "contractor_share_percent", "platform_share_percent", "display_order", "is_active", "created_at") VALUES
	('cf51a77c-8d11-4767-abbb-9e6f100c92fb', 'standard', 'Normal', 'Same-day or scheduled', 0.00, 70.00, 30.00, 1, true, '2026-04-21 20:32:46.750408+00'),
	('525744bd-f5d0-4920-a866-7d186f760689', 'urgent', 'Urgent', 'Within 2-3 hours', 15.00, 65.00, 35.00, 2, true, '2026-04-21 20:32:46.750408+00'),
	('a0dd5b27-5f08-4074-b1a3-34dcb7d0f25b', 'critical', 'Emergency', '45-60 minutes arrival', 30.00, 60.00, 40.00, 3, true, '2026-04-21 20:32:46.750408+00');


--
-- Data for Name: withdrawals; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('avatars', 'avatars', NULL, '2026-04-21 20:32:46.750408+00', '2026-04-21 20:32:46.750408+00', true, false, NULL, NULL, NULL, 'STANDARD'),
	('job-attachments', 'job-attachments', NULL, '2026-04-21 20:32:46.750408+00', '2026-04-21 20:32:46.750408+00', false, false, NULL, NULL, NULL, 'STANDARD'),
	('contractor-documents', 'contractor-documents', NULL, '2026-04-21 20:32:46.750408+00', '2026-04-21 20:32:46.750408+00', false, false, NULL, NULL, NULL, 'STANDARD'),
	('chat-attachments', 'chat-attachments', NULL, '2026-04-21 20:32:46.750408+00', '2026-04-21 20:32:46.750408+00', false, false, NULL, NULL, NULL, 'STANDARD');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata") VALUES
	('e3455045-a75b-460f-a5bb-63d86738ae13', 'avatars', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c/avatar.jpg', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 11:33:29.57482+00', '2026-04-22 11:33:29.57482+00', '2026-04-22 11:33:29.57482+00', '{"eTag": "\"2fdb0e330c10b203b1ed0ee650e3ebd6\"", "size": 23156, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-22T11:33:30.000Z", "contentLength": 23156, "httpStatusCode": 200}', '57048107-526d-48a7-9579-1fdce27a2f06', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '{}'),
	('c31cdee8-24a6-4bac-b526-3313fe1af0c1', 'job-attachments', '57fa1513-c817-4823-aa8f-8ee309d52f82/6314.jpg', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 11:35:02.132308+00', '2026-04-22 11:35:02.132308+00', '2026-04-22 11:35:02.132308+00', '{"eTag": "\"fd2d1a4c6fa91cab9604bbb671fcd4bb\"", "size": 136478, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-22T11:35:03.000Z", "contentLength": 136478, "httpStatusCode": 200}', 'e951717c-0c74-4101-9e48-d6890c62546a', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '{}'),
	('056e9684-c204-42bb-a12d-bbd2e5453ea6', 'job-attachments', '57fa1513-c817-4823-aa8f-8ee309d52f82/6462.png', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 11:35:03.752507+00', '2026-04-22 11:35:03.752507+00', '2026-04-22 11:35:03.752507+00', '{"eTag": "\"cc129e979bc8f1d1f7a737ccb67a1221\"", "size": 1080355, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-22T11:35:04.000Z", "contentLength": 1080355, "httpStatusCode": 200}', '38db1cc8-2261-431d-9cde-9989959bca0e', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '{}'),
	('1be272d4-b9e2-4966-ba54-eae2383f1509', 'job-attachments', '3b1bd57f-68b6-49da-8998-f315166d0320/6462.png', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 11:50:51.642016+00', '2026-04-22 11:50:51.642016+00', '2026-04-22 11:50:51.642016+00', '{"eTag": "\"cc129e979bc8f1d1f7a737ccb67a1221\"", "size": 1080355, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-22T11:50:52.000Z", "contentLength": 1080355, "httpStatusCode": 200}', 'f25407f4-97a9-4f9a-8699-5ecf4b6f6156', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '{}'),
	('7116ea18-098d-4046-8d7e-f4f1e4138858', 'job-attachments', '3b1bd57f-68b6-49da-8998-f315166d0320/5954.jpg', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 11:50:52.508108+00', '2026-04-22 11:50:52.508108+00', '2026-04-22 11:50:52.508108+00', '{"eTag": "\"8c70fc53f4fcb838ae7f7415c44be25e\"", "size": 62472, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-22T11:50:53.000Z", "contentLength": 62472, "httpStatusCode": 200}', '8c29d996-3d73-46c4-b3d9-e1f937798629', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '{}'),
	('68d4d36a-bdfc-4f54-9c97-1b5e59e4873f', 'job-attachments', '1e4e47fc-44f0-47b3-b02d-716639262e96/6462.png', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 11:51:10.928618+00', '2026-04-22 11:51:10.928618+00', '2026-04-22 11:51:10.928618+00', '{"eTag": "\"cc129e979bc8f1d1f7a737ccb67a1221\"", "size": 1080355, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-22T11:51:11.000Z", "contentLength": 1080355, "httpStatusCode": 200}', 'bd5c2d38-c2ee-4712-9517-a99c851ce52e', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '{}'),
	('fd60c03e-7a49-496d-a968-310b58146339', 'job-attachments', '1e4e47fc-44f0-47b3-b02d-716639262e96/5954.jpg', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 11:51:11.866152+00', '2026-04-22 11:51:11.866152+00', '2026-04-22 11:51:11.866152+00', '{"eTag": "\"8c70fc53f4fcb838ae7f7415c44be25e\"", "size": 62472, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-22T11:51:12.000Z", "contentLength": 62472, "httpStatusCode": 200}', 'd3f07125-c603-4abd-8270-e44c73f68171', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '{}'),
	('df5122b2-38c3-4a9d-a26d-4e13e532423d', 'job-attachments', '1a27d5ef-59d8-4db0-87eb-2509e7e8951f/6921.png', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 12:02:44.335493+00', '2026-04-22 12:02:44.335493+00', '2026-04-22 12:02:44.335493+00', '{"eTag": "\"1d006884045dacee723db691af45bad5\"", "size": 53597, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-22T12:02:45.000Z", "contentLength": 53597, "httpStatusCode": 200}', '2bb6e5c3-2b61-4776-aff9-904b2c28ab07', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '{}'),
	('b70839b7-73af-4f5e-8770-70d1b34eb5d9', 'job-attachments', '1a27d5ef-59d8-4db0-87eb-2509e7e8951f/6919.png', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 12:02:45.564075+00', '2026-04-22 12:02:45.564075+00', '2026-04-22 12:02:45.564075+00', '{"eTag": "\"2c644c5a97e264c3f29fdd868810cc6b\"", "size": 174234, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-22T12:02:46.000Z", "contentLength": 174234, "httpStatusCode": 200}', 'cac76e58-5531-4d97-93ac-8517eb26ec7f', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '{}'),
	('3b16cd70-4612-49da-94c7-6d68c17a5cc5', 'job-attachments', '649e1dce-5a36-45d4-9267-d7064af902d0/6921.png', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 12:12:58.564341+00', '2026-04-22 12:12:58.564341+00', '2026-04-22 12:12:58.564341+00', '{"eTag": "\"1d006884045dacee723db691af45bad5\"", "size": 53597, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-22T12:12:59.000Z", "contentLength": 53597, "httpStatusCode": 200}', 'dd7b8c85-2228-4b1d-8dad-240778f9b22c', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '{}'),
	('1939921c-4be8-4643-9af3-e2c792208ff6', 'job-attachments', '649e1dce-5a36-45d4-9267-d7064af902d0/6946.png', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 12:12:59.758619+00', '2026-04-22 12:12:59.758619+00', '2026-04-22 12:12:59.758619+00', '{"eTag": "\"9aba48a2551abbb66986978166268574\"", "size": 186212, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-22T12:13:00.000Z", "contentLength": 186212, "httpStatusCode": 200}', 'f964d40f-2811-474f-8563-fe204632d7bc', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '{}'),
	('12296c09-045e-43f4-97b6-480e68c4e08e', 'job-attachments', '649e1dce-5a36-45d4-9267-d7064af902d0/6919.png', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-22 12:13:00.623222+00', '2026-04-22 12:13:00.623222+00', '2026-04-22 12:13:00.623222+00', '{"eTag": "\"2c644c5a97e264c3f29fdd868810cc6b\"", "size": 174234, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-22T12:13:01.000Z", "contentLength": 174234, "httpStatusCode": 200}', '7158057d-fb45-49d9-8f97-7b0672474bcd', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '{}'),
	('e6c7f71c-2cc8-415f-b09a-49ac08171fc3', 'job-attachments', '935b55a6-b8e1-4941-aa2c-c5bcccaaffbb/image_picker_FDDD3047-9EE6-4BCE-8A05-59E692437D7C-98185-000003FA039CCF89.jpg', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-27 10:20:29.193232+00', '2026-04-27 10:20:29.193232+00', '2026-04-27 10:20:29.193232+00', '{"eTag": "\"b71816241af58e7f66377feba50d5ce4\"", "size": 41889, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-27T10:20:30.000Z", "contentLength": 41889, "httpStatusCode": 200}', '5124b210-2f34-4f4e-8549-aaa580253989', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '{}'),
	('978deb23-b948-4ba1-8a1e-b25a27694224', 'job-attachments', '935b55a6-b8e1-4941-aa2c-c5bcccaaffbb/image_picker_E6A0519E-58C2-4DBD-9C95-ACD86D17EDFD-98185-000003FA038D9245.jpg', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '2026-04-27 10:20:30.381737+00', '2026-04-27 10:20:30.381737+00', '2026-04-27 10:20:30.381737+00', '{"eTag": "\"b71816241af58e7f66377feba50d5ce4\"", "size": 41889, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-27T10:20:31.000Z", "contentLength": 41889, "httpStatusCode": 200}', '4062fae8-5133-482c-b606-959552702e6e', 'c744f5b7-22b6-4d2e-acc5-3809cb5a1a2c', '{}'),
	('494ec56c-7ec4-4b88-a26d-a71ed9739eaf', 'contractor-documents', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb/passport/1777711467361_image_picker_EEE9E4EC-1D3E-4967-B53E-3664CFF7930E-49665-000001F126BBFFC3.jpg', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', '2026-05-02 08:44:37.282299+00', '2026-05-02 08:44:37.282299+00', '2026-05-02 08:44:37.282299+00', '{"eTag": "\"3b688807667773809056e9533fadfb91\"", "size": 2565332, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-02T08:44:38.000Z", "contentLength": 2565332, "httpStatusCode": 200}', 'af77fba9-fa7a-4e05-98a1-1f2bc128e0ff', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', '{}'),
	('340e83a4-32e3-4546-afb3-1beea525e775', 'contractor-documents', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb/police_check/1777711489207_image_picker_EF919A3D-59CB-4C9E-ABEB-64694D285240-49665-000001F15E3C79F0.jpg', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', '2026-05-02 08:44:54.409642+00', '2026-05-02 08:44:54.409642+00', '2026-05-02 08:44:54.409642+00', '{"eTag": "\"62bca4cc0b7a3c15b1f15d7d1c498948\"", "size": 1486421, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-02T08:44:55.000Z", "contentLength": 1486421, "httpStatusCode": 200}', '03bd083d-9747-4242-97be-143b04ea7e46', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', '{}'),
	('df338e5c-0836-454d-a444-9549689119ef', 'contractor-documents', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb/service_licence/1777711513876_image_picker_87D688C4-D4D6-4458-BEB4-D73595A4370C-49665-000001F17D1F9073.jpg', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', '2026-05-02 08:45:17.054434+00', '2026-05-02 08:45:17.054434+00', '2026-05-02 08:45:17.054434+00', '{"eTag": "\"62bca4cc0b7a3c15b1f15d7d1c498948\"", "size": 1486421, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-02T08:45:17.000Z", "contentLength": 1486421, "httpStatusCode": 200}', 'edb73810-8359-41c5-b73c-01ed55f8951e', '5dad96d8-a31a-42be-9c51-15a1e9a7d1fb', '{}'),
	('ddc99679-7219-45f4-bfd2-2ad60f60f73d', 'contractor-documents', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa/government_id/1777798919215_scaled_41288.jpg', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', '2026-05-03 09:02:00.254659+00', '2026-05-03 09:02:00.254659+00', '2026-05-03 09:02:00.254659+00', '{"eTag": "\"f6c191b98ff10a392917cc94cf590bf5\"", "size": 196217, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-03T09:02:01.000Z", "contentLength": 196217, "httpStatusCode": 200}', 'db68690e-0d16-4476-a1aa-a374f2ea1fa9', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', '{}'),
	('f34865a8-affd-4eb7-82c5-4656bdbbbfb9', 'contractor-documents', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa/police_check/1777798928119_scaled_41303.jpg', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', '2026-05-03 09:02:08.597277+00', '2026-05-03 09:02:08.597277+00', '2026-05-03 09:02:08.597277+00', '{"eTag": "\"c86495caa6e1a6b1057da3efceaae086\"", "size": 147534, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-03T09:02:09.000Z", "contentLength": 147534, "httpStatusCode": 200}', '53ba50e1-73f1-41aa-af88-2ce4e4a52624', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', '{}'),
	('629fc9f9-e909-45cc-bf34-4c3963f713bd', 'contractor-documents', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa/service_licence/1777798959417_scaled_37822.jpg', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', '2026-05-03 09:02:40.546297+00', '2026-05-03 09:02:40.546297+00', '2026-05-03 09:02:40.546297+00', '{"eTag": "\"c328df13373ed02bbfd4d4fb0a18ad70\"", "size": 128206, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-03T09:02:41.000Z", "contentLength": 128206, "httpStatusCode": 200}', '613a469e-98e5-4549-9cf5-4363e4a09b44', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', '{}'),
	('68c5c6b8-74a4-4050-a2f5-8ee3385243b3', 'job-attachments', '38696ae4-4fd6-4628-80f2-a64103fda858/41288.jpg', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', '2026-05-04 13:29:59.916642+00', '2026-05-04 13:29:59.916642+00', '2026-05-04 13:29:59.916642+00', '{"eTag": "\"c4c94a906ac7eae0c68db2b74bd31f7a\"", "size": 174012, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-04T13:30:00.000Z", "contentLength": 174012, "httpStatusCode": 200}', 'b9e5a39c-87ea-4ff3-a56e-da858cea7299', '8c25fba9-c744-4dda-a03b-a4d1ef88f1aa', '{}'),
	('df77fa40-6990-4948-a350-35a5e1c48e7a', 'job-attachments', 'bf7b49a3-ef5f-46ab-8f2e-3f83262e2392/1000049340.jpg', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '2026-05-04 14:42:02.795159+00', '2026-05-04 14:42:02.795159+00', '2026-05-04 14:42:02.795159+00', '{"eTag": "\"426d4f7ef788c66222570d897a872eb7\"", "size": 57163, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-04T14:42:03.000Z", "contentLength": 57163, "httpStatusCode": 200}', 'b939644c-5519-4b70-8e06-f44c0a008f5b', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '{}'),
	('c73c4259-9ae1-48d1-a304-4b5310eb2dc4', 'job-attachments', '1efa1f01-59e5-4428-9e31-4222898768d5/1000049144.jpg', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '2026-05-04 14:51:56.832874+00', '2026-05-04 14:51:56.832874+00', '2026-05-04 14:51:56.832874+00', '{"eTag": "\"a5457940e2b9994a835df2564788c233\"", "size": 44078, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-04T14:51:57.000Z", "contentLength": 44078, "httpStatusCode": 200}', '6640352e-ad9c-4f39-9c77-299dbccb42c0', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '{}'),
	('be66b348-2cc3-413b-a090-ad535d8af7f9', 'contractor-documents', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3/drivers_licence/1777906531163_scaled_1000049340.jpg', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '2026-05-04 14:55:32.012774+00', '2026-05-04 14:55:32.012774+00', '2026-05-04 14:55:32.012774+00', '{"eTag": "\"f75326e4805128c9b78015ce00ccc57b\"", "size": 66969, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-04T14:55:32.000Z", "contentLength": 66969, "httpStatusCode": 200}', '8a777766-579d-4f01-90cf-d4e5edf5795d', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '{}'),
	('398650fe-a3c6-4e10-b5f4-8853f45646bf', 'contractor-documents', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3/police_check/1777906538359_scaled_1000049332.jpg', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '2026-05-04 14:55:38.992449+00', '2026-05-04 14:55:38.992449+00', '2026-05-04 14:55:38.992449+00', '{"eTag": "\"4b9972f8e10935966f550713ec75076d\"", "size": 76042, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-04T14:55:39.000Z", "contentLength": 76042, "httpStatusCode": 200}', 'b6a512c0-07c4-4bf0-9ff5-6d96375813fb', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '{}'),
	('9302dee3-d4d1-4aac-8721-4ab36e088424', 'contractor-documents', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3/service_licence/1777906562153_scaled_1000048772.jpg', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '2026-05-04 14:56:03.014978+00', '2026-05-04 14:56:03.014978+00', '2026-05-04 14:56:03.014978+00', '{"eTag": "\"1930dd8e8a647e2f42c9d8ae1649801f\"", "size": 146061, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-04T14:56:03.000Z", "contentLength": 146061, "httpStatusCode": 200}', '252eda81-9d60-4080-8da0-6662ce5205e5', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '{}'),
	('e0c0a462-c113-430b-9e01-8d4ee8f9871b', 'job-attachments', '6bef9d24-3e10-4cfe-8c73-0ce6bb4c88eb/1000049144.jpg', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '2026-05-04 14:58:11.779946+00', '2026-05-04 14:58:11.779946+00', '2026-05-04 14:58:11.779946+00', '{"eTag": "\"a5457940e2b9994a835df2564788c233\"", "size": 44078, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-04T14:58:12.000Z", "contentLength": 44078, "httpStatusCode": 200}', '1194588a-c328-48e0-b1a0-2c240f2a5bd6', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '{}'),
	('15b76036-a6f4-4f86-ab80-58689cf2724d', 'job-attachments', '1bdedffe-8a37-4f52-a775-9862289073cd/1000064416.jpg', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '2026-06-10 13:22:32.084793+00', '2026-06-10 13:22:32.084793+00', '2026-06-10 13:22:32.084793+00', '{"eTag": "\"a5d97270e012fc8d7eeb589d26a8db8d\"", "size": 76814, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-10T13:22:33.000Z", "contentLength": 76814, "httpStatusCode": 200}', '09c51d9f-ca3b-445c-9140-f27caa918382', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '{}'),
	('4cf26fcf-df6b-4b3a-be67-a0cf32ce1a64', 'job-attachments', '14be789d-c4e6-4727-b2fb-00205b060ffd/1000062878.jpg', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '2026-06-10 16:38:46.877332+00', '2026-06-10 16:38:46.877332+00', '2026-06-10 16:38:46.877332+00', '{"eTag": "\"79a53f161c56fa8a0aa35169f45062fe\"", "size": 110558, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-10T16:38:47.000Z", "contentLength": 110558, "httpStatusCode": 200}', 'ac71f74f-dc39-466f-8d1e-28d46fbed2a8', 'a8bd45b0-5413-44b2-aef2-6bd74478a8a3', '{}');


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 71, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict yD6xZmSabRMn8gVVgRPAPlvantMmcIWoXDauKo8c6PpHb9qKlCj8exwLUcJPMgg

RESET ALL;
