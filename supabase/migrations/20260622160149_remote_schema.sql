
  create table "public"."job_operations_log" (
    "id" uuid not null,
    "job_id" uuid not null,
    "operation_type" text not null,
    "reason" text,
    "actor_id" uuid not null,
    "metadata" jsonb,
    "created_at" timestamp without time zone default now()
      );


alter table "public"."job_operations_log" enable row level security;

CREATE INDEX idx_job_operations_by_job_id ON public.job_operations_log USING btree (job_id);

CREATE INDEX idx_job_operations_by_type ON public.job_operations_log USING btree (operation_type);

CREATE UNIQUE INDEX job_operations_log_pkey ON public.job_operations_log USING btree (id);

alter table "public"."job_operations_log" add constraint "job_operations_log_pkey" PRIMARY KEY using index "job_operations_log_pkey";

alter table "public"."job_operations_log" add constraint "job_operations_log_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) not valid;

alter table "public"."job_operations_log" validate constraint "job_operations_log_job_id_fkey";

grant delete on table "public"."job_operations_log" to "anon";

grant insert on table "public"."job_operations_log" to "anon";

grant references on table "public"."job_operations_log" to "anon";

grant select on table "public"."job_operations_log" to "anon";

grant trigger on table "public"."job_operations_log" to "anon";

grant truncate on table "public"."job_operations_log" to "anon";

grant update on table "public"."job_operations_log" to "anon";

grant delete on table "public"."job_operations_log" to "authenticated";

grant insert on table "public"."job_operations_log" to "authenticated";

grant references on table "public"."job_operations_log" to "authenticated";

grant select on table "public"."job_operations_log" to "authenticated";

grant trigger on table "public"."job_operations_log" to "authenticated";

grant truncate on table "public"."job_operations_log" to "authenticated";

grant update on table "public"."job_operations_log" to "authenticated";

grant delete on table "public"."job_operations_log" to "service_role";

grant insert on table "public"."job_operations_log" to "service_role";

grant references on table "public"."job_operations_log" to "service_role";

grant select on table "public"."job_operations_log" to "service_role";

grant trigger on table "public"."job_operations_log" to "service_role";

grant truncate on table "public"."job_operations_log" to "service_role";

grant update on table "public"."job_operations_log" to "service_role";


