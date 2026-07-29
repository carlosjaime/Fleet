-- ============================================================================
-- FleetOps · Esquema base
-- Migración 0001: extensiones, tablas, restricciones e índices.
-- ============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enumeraciones
-- ---------------------------------------------------------------------------
create type org_role as enum ('owner', 'admin', 'dispatcher', 'operator', 'viewer');
create type member_status as enum ('active', 'invited', 'suspended');
create type truck_status as enum ('active', 'idle', 'offline', 'maintenance');
create type driver_status as enum ('available', 'assigned', 'off_duty', 'suspended');
create type route_status as enum ('draft', 'scheduled', 'in_progress', 'paused', 'completed', 'cancelled');
create type route_priority as enum ('low', 'normal', 'high', 'urgent');
create type waypoint_status as enum ('pending', 'arrived', 'departed', 'skipped');
create type alert_type as enum ('speeding', 'route_deviation', 'low_fuel', 'delay', 'gps_offline', 'maintenance_due', 'unauthorized_stop');
create type alert_severity as enum ('info', 'warning', 'critical');
create type alert_status as enum ('open', 'acknowledged', 'resolved');
create type maintenance_status as enum ('scheduled', 'in_progress', 'completed', 'cancelled', 'overdue');
create type maintenance_type as enum ('preventive', 'corrective', 'inspection');
create type api_key_status as enum ('active', 'revoked');
create type telemetry_source as enum ('device', 'simulator', 'manual');

-- ---------------------------------------------------------------------------
-- Trigger genérico updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  country text not null default 'MX',
  timezone text not null default 'America/Mexico_City',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_organizations_updated before update on public.organizations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- organization_members
-- ---------------------------------------------------------------------------
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role org_role not null default 'viewer',
  status member_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_org_member unique (organization_id, user_id)
);
create index idx_members_user on public.organization_members(user_id);
create index idx_members_org on public.organization_members(organization_id);
create trigger trg_members_updated before update on public.organization_members
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- organization_settings
-- ---------------------------------------------------------------------------
create table public.organization_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  speed_limit_kmh integer not null default 90 check (speed_limit_kmh between 10 and 200),
  low_fuel_threshold_pct integer not null default 20 check (low_fuel_threshold_pct between 1 and 90),
  route_deviation_tolerance_meters integer not null default 1000 check (route_deviation_tolerance_meters between 50 and 50000),
  delay_tolerance_minutes integer not null default 15 check (delay_tolerance_minutes between 1 and 1440),
  gps_offline_minutes integer not null default 10 check (gps_offline_minutes between 1 and 1440),
  metric_units boolean not null default true,
  currency text not null default 'MXN',
  alert_preferences jsonb not null default '{}'::jsonb,
  simulator_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_settings_updated before update on public.organization_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- drivers
-- ---------------------------------------------------------------------------
create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  license_number text,
  license_type text,
  license_expiration date,
  status driver_status not null default 'available',
  photo_url text,
  emergency_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_drivers_org on public.drivers(organization_id);
create index idx_drivers_status on public.drivers(organization_id, status);
create trigger trg_drivers_updated before update on public.drivers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- trucks
-- ---------------------------------------------------------------------------
create table public.trucks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  unit_number text not null,
  plate text not null,
  vin text,
  brand text,
  model text,
  year integer check (year is null or year between 1950 and 2100),
  color text,
  vehicle_type text,
  capacity_kg numeric(10,2),
  fuel_type text,
  fuel_capacity_liters numeric(10,2),
  current_fuel_pct numeric(5,2) check (current_fuel_pct is null or current_fuel_pct between 0 and 100),
  odometer_km numeric(12,2) not null default 0,
  status truck_status not null default 'idle',
  active_driver_id uuid references public.drivers(id) on delete set null,
  last_latitude double precision,
  last_longitude double precision,
  last_speed_kmh numeric(6,2),
  last_heading numeric(5,2),
  last_location_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_truck_unit unique (organization_id, unit_number),
  constraint uq_truck_plate unique (organization_id, plate)
);
create unique index uq_truck_vin on public.trucks(organization_id, vin) where vin is not null;
create index idx_trucks_org on public.trucks(organization_id);
create index idx_trucks_status on public.trucks(organization_id, status);
create trigger trg_trucks_updated before update on public.trucks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- routes
-- ---------------------------------------------------------------------------
create table public.routes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  reference text,
  origin_name text not null,
  origin_latitude double precision not null,
  origin_longitude double precision not null,
  destination_name text not null,
  destination_latitude double precision not null,
  destination_longitude double precision not null,
  truck_id uuid references public.trucks(id) on delete set null,
  driver_id uuid references public.drivers(id) on delete set null,
  status route_status not null default 'draft',
  priority route_priority not null default 'normal',
  scheduled_start_at timestamptz,
  scheduled_end_at timestamptz,
  actual_start_at timestamptz,
  actual_end_at timestamptz,
  estimated_distance_km numeric(10,2),
  actual_distance_km numeric(10,2),
  estimated_duration_minutes integer,
  progress_pct numeric(5,2) not null default 0 check (progress_pct between 0 and 100),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_routes_org on public.routes(organization_id);
create index idx_routes_status on public.routes(organization_id, status);
create index idx_routes_truck on public.routes(truck_id);
-- Una unidad y un conductor sólo pueden tener una ruta activa a la vez.
create unique index uq_route_active_truck on public.routes(truck_id)
  where status in ('in_progress', 'paused') and truck_id is not null;
create unique index uq_route_active_driver on public.routes(driver_id)
  where status in ('in_progress', 'paused') and driver_id is not null;
create trigger trg_routes_updated before update on public.routes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- route_waypoints
-- ---------------------------------------------------------------------------
create table public.route_waypoints (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sequence integer not null,
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  status waypoint_status not null default 'pending',
  arrived_at timestamptz,
  departed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_waypoint_seq unique (route_id, sequence)
);
create index idx_waypoints_route on public.route_waypoints(route_id);
create trigger trg_waypoints_updated before update on public.route_waypoints
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- truck_locations (historial)
-- ---------------------------------------------------------------------------
create table public.truck_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  truck_id uuid not null references public.trucks(id) on delete cascade,
  route_id uuid references public.routes(id) on delete set null,
  latitude double precision not null,
  longitude double precision not null,
  speed_kmh numeric(6,2),
  heading numeric(5,2),
  fuel_pct numeric(5,2),
  odometer_km numeric(12,2),
  accuracy_meters numeric(8,2),
  recorded_at timestamptz not null default now(),
  source telemetry_source not null default 'device',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_locations_org on public.truck_locations(organization_id);
create index idx_locations_truck on public.truck_locations(truck_id);
create index idx_locations_recorded on public.truck_locations(recorded_at desc);
create index idx_locations_truck_recorded on public.truck_locations(truck_id, recorded_at desc);
create index idx_locations_org_recorded on public.truck_locations(organization_id, recorded_at desc);

-- ---------------------------------------------------------------------------
-- telemetry_events
-- ---------------------------------------------------------------------------
create table public.telemetry_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  truck_id uuid not null references public.trucks(id) on delete cascade,
  route_id uuid references public.routes(id) on delete set null,
  event_type text not null,
  severity alert_severity not null default 'info',
  value numeric,
  payload jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index idx_events_org on public.telemetry_events(organization_id, recorded_at desc);
create index idx_events_truck on public.telemetry_events(truck_id, recorded_at desc);

-- ---------------------------------------------------------------------------
-- alerts
-- ---------------------------------------------------------------------------
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  truck_id uuid references public.trucks(id) on delete set null,
  driver_id uuid references public.drivers(id) on delete set null,
  route_id uuid references public.routes(id) on delete set null,
  type alert_type not null,
  severity alert_severity not null default 'warning',
  title text not null,
  description text,
  latitude double precision,
  longitude double precision,
  status alert_status not null default 'open',
  detected_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_alerts_org on public.alerts(organization_id, status, detected_at desc);
create index idx_alerts_truck on public.alerts(truck_id);
-- Deduplicación de alertas abiertas por unidad y tipo.
create unique index uq_alert_open on public.alerts(organization_id, truck_id, type)
  where status = 'open' and truck_id is not null;
create trigger trg_alerts_updated before update on public.alerts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- maintenance_records
-- ---------------------------------------------------------------------------
create table public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  truck_id uuid not null references public.trucks(id) on delete cascade,
  type maintenance_type not null default 'preventive',
  description text,
  status maintenance_status not null default 'scheduled',
  scheduled_at timestamptz,
  completed_at timestamptz,
  odometer_at_service numeric(12,2),
  next_service_odometer numeric(12,2),
  next_service_date date,
  cost numeric(12,2),
  provider text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_maintenance_org on public.maintenance_records(organization_id, status);
create index idx_maintenance_truck on public.maintenance_records(truck_id);
create trigger trg_maintenance_updated before update on public.maintenance_records
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- fuel_logs
-- ---------------------------------------------------------------------------
create table public.fuel_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  truck_id uuid not null references public.trucks(id) on delete cascade,
  driver_id uuid references public.drivers(id) on delete set null,
  liters numeric(10,2) not null check (liters > 0),
  price_per_liter numeric(10,2) not null check (price_per_liter >= 0),
  total_cost numeric(12,2) not null check (total_cost >= 0),
  odometer_km numeric(12,2),
  fuel_station text,
  latitude double precision,
  longitude double precision,
  receipt_url text,
  recorded_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_fuel_org on public.fuel_logs(organization_id, recorded_at desc);
create index idx_fuel_truck on public.fuel_logs(truck_id, recorded_at desc);
create trigger trg_fuel_updated before update on public.fuel_logs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- activity_logs
-- ---------------------------------------------------------------------------
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_activity_org on public.activity_logs(organization_id, created_at desc);

-- ---------------------------------------------------------------------------
-- device_api_keys
-- ---------------------------------------------------------------------------
create table public.device_api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  truck_id uuid references public.trucks(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  status api_key_status not null default 'active',
  last_used_at timestamptz,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index idx_apikeys_org on public.device_api_keys(organization_id);
create index idx_apikeys_hash on public.device_api_keys(key_hash) where status = 'active';
