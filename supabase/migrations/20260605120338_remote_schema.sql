alter table "public"."profiles" drop constraint "profiles_role_check";

alter table "public"."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'contractor'::text, 'admin'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";


