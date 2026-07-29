import "server-only";
import { createClient } from "@/lib/supabase/server";
import { average } from "@/lib/utils/metrics";
import type { TruckStatus } from "@/types/domain";

export interface DashboardKpis {
  totalTrucks: number;
  activeTrucks: number;
  idleTrucks: number;
  maintenanceTrucks: number;
  offlineTrucks: number;
  routesInProgress: number;
  openAlerts: number;
  avgSpeedKmh: number;
  avgFuelPct: number;
  onTimeDeliveryPct: number;
  distanceTodayKm: number;
}

export async function getDashboardKpis(organizationId: string): Promise<DashboardKpis> {
  const supabase = await createClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [trucksRes, routesRes, alertsRes, locationsRes] = await Promise.all([
    supabase.from("trucks").select("status, last_speed_kmh, current_fuel_pct").eq("organization_id", organizationId),
    supabase
      .from("routes")
      .select("status, scheduled_end_at, actual_end_at")
      .eq("organization_id", organizationId),
    supabase
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "open"),
    supabase
      .from("truck_locations")
      .select("truck_id, odometer_km, recorded_at")
      .eq("organization_id", organizationId)
      .gte("recorded_at", todayStart.toISOString())
      .order("recorded_at", { ascending: true }),
  ]);

  const trucks = trucksRes.data ?? [];
  const routes = routesRes.data ?? [];
  const locations = locationsRes.data ?? [];

  const statusCount = { active: 0, idle: 0, maintenance: 0, offline: 0 };
  for (const t of trucks) {
    if (t.status in statusCount) statusCount[t.status as keyof typeof statusCount] += 1;
  }

  const routesInProgress = routes.filter((r) => r.status === "in_progress").length;
  const completed = routes.filter((r) => r.status === "completed");
  const onTime = completed.filter(
    (r) => r.scheduled_end_at && r.actual_end_at && new Date(r.actual_end_at) <= new Date(r.scheduled_end_at),
  );
  const onTimeDeliveryPct = completed.length > 0 ? Math.round((onTime.length / completed.length) * 100) : 0;

  const odometerByTruck = new Map<string, { min: number; max: number }>();
  for (const loc of locations) {
    if (loc.odometer_km == null) continue;
    const entry = odometerByTruck.get(loc.truck_id);
    if (!entry) odometerByTruck.set(loc.truck_id, { min: loc.odometer_km, max: loc.odometer_km });
    else {
      entry.min = Math.min(entry.min, loc.odometer_km);
      entry.max = Math.max(entry.max, loc.odometer_km);
    }
  }
  let distanceTodayKm = 0;
  for (const { min, max } of odometerByTruck.values()) distanceTodayKm += Math.max(0, max - min);

  return {
    totalTrucks: trucks.length,
    activeTrucks: statusCount.active,
    idleTrucks: statusCount.idle,
    maintenanceTrucks: statusCount.maintenance,
    offlineTrucks: statusCount.offline,
    routesInProgress,
    openAlerts: alertsRes.count ?? 0,
    avgSpeedKmh: Math.round(average(trucks.map((t) => t.last_speed_kmh)) * 10) / 10,
    avgFuelPct: Math.round(average(trucks.map((t) => t.current_fuel_pct))),
    onTimeDeliveryPct,
    distanceTodayKm: Math.round(distanceTodayKm * 10) / 10,
  };
}

export interface FleetSnapshotRow {
  id: string;
  unit_number: string;
  name: string;
  status: TruckStatus;
  last_latitude: number | null;
  last_longitude: number | null;
  last_heading: number | null;
  last_speed_kmh: number | null;
  current_fuel_pct: number | null;
  last_location_at: string | null;
  driver: { id: string; full_name: string } | null;
}

export async function getFleetSnapshot(organizationId: string): Promise<FleetSnapshotRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trucks")
    .select(
      "id, unit_number, name, status, last_latitude, last_longitude, last_heading, last_speed_kmh, current_fuel_pct, last_location_at, driver:drivers!trucks_active_driver_id_fkey(id, full_name)",
    )
    .eq("organization_id", organizationId)
    .order("unit_number", { ascending: true })
    .returns<FleetSnapshotRow[]>();

  if (error) throw error;
  return data ?? [];
}

export async function getRecentActivity(organizationId: string, limit = 15) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("id, action, entity_type, entity_id, metadata, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getRouteTracks(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("routes")
    .select("id, origin_latitude, origin_longitude, destination_latitude, destination_longitude")
    .eq("organization_id", organizationId)
    .eq("status", "in_progress");

  if (error) throw error;
  return data ?? [];
}
