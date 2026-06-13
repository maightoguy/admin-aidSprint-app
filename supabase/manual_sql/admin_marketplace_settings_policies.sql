drop policy if exists "Admins can insert platform config" on public.platform_config;
create policy "Admins can insert platform config"
on public.platform_config
for insert
to authenticated
with check (public.is_admin_user());

drop policy if exists "Admins can update platform config" on public.platform_config;
create policy "Admins can update platform config"
on public.platform_config
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins can insert service categories" on public.service_categories;
create policy "Admins can insert service categories"
on public.service_categories
for insert
to authenticated
with check (public.is_admin_user());

drop policy if exists "Admins can update service categories" on public.service_categories;
create policy "Admins can update service categories"
on public.service_categories
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins can insert service types" on public.service_types;
create policy "Admins can insert service types"
on public.service_types
for insert
to authenticated
with check (public.is_admin_user());

drop policy if exists "Admins can update service types" on public.service_types;
create policy "Admins can update service types"
on public.service_types
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins can insert urgency tiers" on public.urgency_tiers;
create policy "Admins can insert urgency tiers"
on public.urgency_tiers
for insert
to authenticated
with check (public.is_admin_user());

drop policy if exists "Admins can update urgency tiers" on public.urgency_tiers;
create policy "Admins can update urgency tiers"
on public.urgency_tiers
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

