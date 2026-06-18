set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_contractor_verification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if new.id_verification_complete
    and new.police_check_complete
    and new.service_licences_complete then
    new.is_verified = true;

    if new.availability_status = 'pending_approval' then
      new.availability_status = 'offline';
    end if;
  end if;

  return new;
end;
$function$
;


