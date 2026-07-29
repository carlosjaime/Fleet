/**
 * Tipos de dominio centralizados de FleetOps.
 * Derivan de los tipos de la base de datos para mantener una sola fuente
 * de verdad.
 */
import type { Tables, OrgRole } from "./database.types";

export type {
  OrgRole,
  MemberStatus,
  TruckStatus,
  DriverStatus,
  RouteStatus,
  RoutePriority,
  WaypointStatus,
  AlertType,
  AlertSeverity,
  AlertStatus,
  MaintenanceStatus,
  MaintenanceType,
  ApiKeyStatus,
  TelemetrySource,
} from "./database.types";

export type Profile = Tables<"profiles">;
export type Organization = Tables<"organizations">;
export type OrganizationMember = Tables<"organization_members">;
export type OrganizationSettings = Tables<"organization_settings">;
export type Truck = Tables<"trucks">;
export type Driver = Tables<"drivers">;
export type Route = Tables<"routes">;
export type RouteWaypoint = Tables<"route_waypoints">;
export type TruckLocation = Tables<"truck_locations">;
export type TelemetryEvent = Tables<"telemetry_events">;
export type Alert = Tables<"alerts">;
export type MaintenanceRecord = Tables<"maintenance_records">;
export type FuelLog = Tables<"fuel_logs">;
export type ActivityLog = Tables<"activity_logs">;
export type DeviceApiKey = Tables<"device_api_keys">;

/** Coordenada geográfica. */
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/** Camión con datos relacionados frecuentes en listados. */
export interface TruckWithDriver extends Truck {
  driver: Pick<Driver, "id" | "full_name" | "status"> | null;
}

/** Contexto de la organización activa del usuario. */
export interface OrganizationContext {
  organization: Organization;
  role: OrgRole;
  membershipId: string;
}
