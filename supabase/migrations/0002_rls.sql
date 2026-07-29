-- ============================================================================
-- FleetOps · Row Level Security
-- Migración 0002: funciones auxiliares y políticas.
--
-- Nota sobre recursión: las políticas de otras tablas consultan la membresía
-- del usuario. Si esas consultas dispararan de nuevo RLS sobre
-- organization_members se produciría recursión infinita. Para evitarlo, las
-- funciones auxiliares son SECURITY DEFINER y consultan la tabla saltándose
-- RLS de forma controlada.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Funciones auxiliares (SECURITY DEFINER, sin recursión)
-- ---------------------------------------------------------------------------
create or replace function public.is_organization_member(organization_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = organization_uuid
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.current_user_organization_role(organization_uuid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role::text
  from public.organization_members m
  where m.organization_id = organization_uuid
    and m.user_id = auth.uid()
    and m.status = 'active'
  limit 1;
$$;

create or replace function public.has_organization_role(organization_uuid uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = organization_uuid
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role::text = any(allowed_roles)
  );
$$;

-- ---------------------------------------------------------------------------
-- Activar RLS en todas las tablas privadas
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_settings enable row level security;
alter table public.drivers enable row level security;
alter table public.trucks enable row level security;
alter table public.routes enable row level security;
alter table public.route_waypoints enable row level security;
alter table public.truck_locations enable row level security;
alter table public.telemetry_events enable row level security;
alter table public.alerts enable row level security;
alter table public.maintenance_records enable row level security;
alter table public.fuel_logs enable row level security;
alter table public.activity_logs enable row level security;
alter table public.device_api_keys enable row level security;

-- ---------------------------------------------------------------------------
-- profiles: cada quien administra su propio perfil.
-- ---------------------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
create policy "orgs_select_member" on public.organizations
  for select using (public.is_organization_member(id));
-- Cualquier usuario autenticado puede crear una organización (se vuelve owner).
create policy "orgs_insert_auth" on public.organizations
  for insert with check (auth.uid() is not null and created_by = auth.uid());
create policy "orgs_update_admin" on public.organizations
  for update using (public.has_organization_role(id, array['owner', 'admin']));
create policy "orgs_delete_owner" on public.organizations
  for delete using (public.has_organization_role(id, array['owner']));

-- ---------------------------------------------------------------------------
-- organization_members
-- La política de SELECT usa la función SECURITY DEFINER para evitar recursión.
-- ---------------------------------------------------------------------------
create policy "members_select" on public.organization_members
  for select using (public.is_organization_member(organization_id));
-- El usuario puede insertar su propia membresía inicial (onboarding), o un
-- admin/owner puede agregar miembros.
create policy "members_insert" on public.organization_members
  for insert with check (
    user_id = auth.uid()
    or public.has_organization_role(organization_id, array['owner', 'admin'])
  );
create policy "members_update_admin" on public.organization_members
  for update using (public.has_organization_role(organization_id, array['owner', 'admin']));
create policy "members_delete_admin" on public.organization_members
  for delete using (public.has_organization_role(organization_id, array['owner', 'admin']));

-- ---------------------------------------------------------------------------
-- organization_settings
-- ---------------------------------------------------------------------------
create policy "settings_select" on public.organization_settings
  for select using (public.is_organization_member(organization_id));
create policy "settings_insert_admin" on public.organization_settings
  for insert with check (public.has_organization_role(organization_id, array['owner', 'admin']));
create policy "settings_update_admin" on public.organization_settings
  for update using (public.has_organization_role(organization_id, array['owner', 'admin']));

-- ---------------------------------------------------------------------------
-- Helper de políticas por recurso operativo.
-- Lectura: cualquier miembro. Escritura: owner/admin/dispatcher.
-- Borrado en flota: sólo owner/admin.
-- ---------------------------------------------------------------------------

-- drivers
create policy "drivers_select" on public.drivers
  for select using (public.is_organization_member(organization_id));
create policy "drivers_insert" on public.drivers
  for insert with check (public.has_organization_role(organization_id, array['owner', 'admin', 'dispatcher']));
create policy "drivers_update" on public.drivers
  for update using (public.has_organization_role(organization_id, array['owner', 'admin', 'dispatcher']));
create policy "drivers_delete" on public.drivers
  for delete using (public.has_organization_role(organization_id, array['owner', 'admin']));

-- trucks
create policy "trucks_select" on public.trucks
  for select using (public.is_organization_member(organization_id));
create policy "trucks_insert" on public.trucks
  for insert with check (public.has_organization_role(organization_id, array['owner', 'admin', 'dispatcher']));
create policy "trucks_update" on public.trucks
  for update using (public.has_organization_role(organization_id, array['owner', 'admin', 'dispatcher']));
create policy "trucks_delete" on public.trucks
  for delete using (public.has_organization_role(organization_id, array['owner', 'admin']));

-- routes
create policy "routes_select" on public.routes
  for select using (public.is_organization_member(organization_id));
create policy "routes_insert" on public.routes
  for insert with check (public.has_organization_role(organization_id, array['owner', 'admin', 'dispatcher']));
create policy "routes_update" on public.routes
  for update using (public.has_organization_role(organization_id, array['owner', 'admin', 'dispatcher']));
create policy "routes_delete" on public.routes
  for delete using (public.has_organization_role(organization_id, array['owner', 'admin']));

-- route_waypoints
create policy "waypoints_select" on public.route_waypoints
  for select using (public.is_organization_member(organization_id));
create policy "waypoints_write" on public.route_waypoints
  for all using (public.has_organization_role(organization_id, array['owner', 'admin', 'dispatcher']))
  with check (public.has_organization_role(organization_id, array['owner', 'admin', 'dispatcher']));

-- truck_locations: lectura de miembros; escritura vía service role (ingestión).
create policy "locations_select" on public.truck_locations
  for select using (public.is_organization_member(organization_id));

-- telemetry_events: lectura de miembros; escritura vía service role.
create policy "events_select" on public.telemetry_events
  for select using (public.is_organization_member(organization_id));

-- alerts: lectura de miembros; operator+ puede reconocer/resolver (update).
create policy "alerts_select" on public.alerts
  for select using (public.is_organization_member(organization_id));
create policy "alerts_update_operator" on public.alerts
  for update using (public.has_organization_role(organization_id, array['owner', 'admin', 'dispatcher', 'operator']));
create policy "alerts_insert" on public.alerts
  for insert with check (public.has_organization_role(organization_id, array['owner', 'admin', 'dispatcher', 'operator']));

-- maintenance_records
create policy "maintenance_select" on public.maintenance_records
  for select using (public.is_organization_member(organization_id));
create policy "maintenance_write" on public.maintenance_records
  for all using (public.has_organization_role(organization_id, array['owner', 'admin', 'dispatcher']))
  with check (public.has_organization_role(organization_id, array['owner', 'admin', 'dispatcher']));

-- fuel_logs: operator+ puede registrar.
create policy "fuel_select" on public.fuel_logs
  for select using (public.is_organization_member(organization_id));
create policy "fuel_insert" on public.fuel_logs
  for insert with check (public.has_organization_role(organization_id, array['owner', 'admin', 'dispatcher', 'operator']));
create policy "fuel_update" on public.fuel_logs
  for update using (public.has_organization_role(organization_id, array['owner', 'admin', 'dispatcher', 'operator']));
create policy "fuel_delete" on public.fuel_logs
  for delete using (public.has_organization_role(organization_id, array['owner', 'admin']));

-- activity_logs: lectura de miembros; escritura vía service role.
create policy "activity_select" on public.activity_logs
  for select using (public.is_organization_member(organization_id));

-- device_api_keys: sólo owner/admin gestionan; el hash nunca sale por API.
create policy "apikeys_select_admin" on public.device_api_keys
  for select using (public.has_organization_role(organization_id, array['owner', 'admin']));
create policy "apikeys_write_admin" on public.device_api_keys
  for all using (public.has_organization_role(organization_id, array['owner', 'admin']))
  with check (public.has_organization_role(organization_id, array['owner', 'admin']));
