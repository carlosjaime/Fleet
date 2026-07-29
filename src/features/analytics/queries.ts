import "server-only";
import { createClient } from "@/lib/supabase/server";
import { average, fleetUtilizationPct } from "@/lib/utils/metrics";

export interface AnalyticsFilters {
  from: string;
  to: string;
}

export interface DailyDistancePoint {
  date: string;
  distanceKm: number;
}

export interface FuelCostPoint {
  date: string;
  liters: number;
  cost: number;
}

export interface AlertsByType {
  type: string;
  count: number;
}

export interface DriverPerformance {
  driverId: string;
  name: string;
  completedRoutes: number;
  onTimeRoutes: number;
}

export interface TruckPerformance {
  truckId: string;
  unitNumber: string;
  distanceKm: number;
  alertCount: number;
}

export interface AnalyticsSummary {
  distanceByDay: DailyDistancePoint[];
  fuelByDay: FuelCostPoint[];
  routesCompleted: number;
  onTimeDeliveryPct: number;
  alertsByType: AlertsByType[];
  fleetUtilizationPct: number;
  avgSpeedKmh: number;
  driverPerformance: DriverPerformance[];
  truckPerformance: TruckPerformance[];
  totalDistanceKm: number;
  totalFuelCost: number;
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export async function getAnalyticsSummary(
  organizationId: string,
  filters: AnalyticsFilters,
): Promise<AnalyticsSummary> {
  const supabase = await createClient();

  const [locationsRes, fuelRes, routesRes, alertsRes, trucksRes, driversRes] = await Promise.all([
    supabase
      .from("truck_locations")
      .select("truck_id, odometer_km, speed_kmh, recorded_at")
      .eq("organization_id", organizationId)
      .gte("recorded_at", filters.from)
      .lte("recorded_at", filters.to)
      .order("recorded_at", { ascending: true }),
    supabase
      .from("fuel_logs")
      .select("liters, total_cost, recorded_at")
      .eq("organization_id", organizationId)
      .gte("recorded_at", filters.from)
      .lte("recorded_at", filters.to),
    supabase
      .from("routes")
      .select("id, driver_id, status, scheduled_end_at, actual_end_at, actual_distance_km, truck_id")
      .eq("organization_id", organizationId)
      .gte("created_at", filters.from)
      .lte("created_at", filters.to),
    supabase
      .from("alerts")
      .select("type, truck_id")
      .eq("organization_id", organizationId)
      .gte("detected_at", filters.from)
      .lte("detected_at", filters.to),
    supabase.from("trucks").select("id, unit_number, status").eq("organization_id", organizationId),
    supabase.from("drivers").select("id, full_name").eq("organization_id", organizationId),
  ]);

  // Distancia por día: usa el rango de odómetro por unidad y día.
  const odometerByTruckDay = new Map<string, { min: number; max: number }>();
  const speeds: number[] = [];
  for (const loc of locationsRes.data ?? []) {
    if (loc.speed_kmh != null) speeds.push(loc.speed_kmh);
    if (loc.odometer_km == null) continue;
    const key = `${loc.truck_id}:${dayKey(loc.recorded_at)}`;
    const entry = odometerByTruckDay.get(key);
    if (!entry) odometerByTruckDay.set(key, { min: loc.odometer_km, max: loc.odometer_km });
    else {
      entry.min = Math.min(entry.min, loc.odometer_km);
      entry.max = Math.max(entry.max, loc.odometer_km);
    }
  }
  const distanceByDayMap = new Map<string, number>();
  for (const [key, { min, max }] of odometerByTruckDay) {
    const date = key.split(":")[1]!;
    distanceByDayMap.set(date, (distanceByDayMap.get(date) ?? 0) + Math.max(0, max - min));
  }
  const distanceByDay: DailyDistancePoint[] = Array.from(distanceByDayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, distanceKm]) => ({ date, distanceKm: Math.round(distanceKm * 10) / 10 }));

  // Combustible por día.
  const fuelByDayMap = new Map<string, { liters: number; cost: number }>();
  for (const log of fuelRes.data ?? []) {
    const date = dayKey(log.recorded_at);
    const entry = fuelByDayMap.get(date) ?? { liters: 0, cost: 0 };
    entry.liters += log.liters;
    entry.cost += log.total_cost;
    fuelByDayMap.set(date, entry);
  }
  const fuelByDay: FuelCostPoint[] = Array.from(fuelByDayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, liters: Math.round(v.liters * 10) / 10, cost: Math.round(v.cost * 100) / 100 }));

  // Rutas completadas y entregas a tiempo.
  const routes = routesRes.data ?? [];
  const completedRoutes = routes.filter((r) => r.status === "completed");
  const onTime = completedRoutes.filter(
    (r) => r.scheduled_end_at && r.actual_end_at && new Date(r.actual_end_at) <= new Date(r.scheduled_end_at),
  );
  const onTimeDeliveryPct =
    completedRoutes.length > 0 ? Math.round((onTime.length / completedRoutes.length) * 100) : 0;

  // Alertas por tipo.
  const alertTypeCount = new Map<string, number>();
  const alertsByTruck = new Map<string, number>();
  for (const a of alertsRes.data ?? []) {
    alertTypeCount.set(a.type, (alertTypeCount.get(a.type) ?? 0) + 1);
    if (a.truck_id) alertsByTruck.set(a.truck_id, (alertsByTruck.get(a.truck_id) ?? 0) + 1);
  }
  const alertsByType: AlertsByType[] = Array.from(alertTypeCount.entries()).map(([type, count]) => ({
    type,
    count,
  }));

  // Utilización de flota.
  const trucks = trucksRes.data ?? [];
  const activeTrucks = trucks.filter((t) => t.status === "active").length;
  const utilization = fleetUtilizationPct(activeTrucks, trucks.length);

  // Rendimiento por conductor.
  const drivers = driversRes.data ?? [];
  const driverStats = new Map<string, { completed: number; onTime: number }>();
  for (const r of completedRoutes) {
    if (!r.driver_id) continue;
    const entry = driverStats.get(r.driver_id) ?? { completed: 0, onTime: 0 };
    entry.completed += 1;
    if (r.scheduled_end_at && r.actual_end_at && new Date(r.actual_end_at) <= new Date(r.scheduled_end_at)) {
      entry.onTime += 1;
    }
    driverStats.set(r.driver_id, entry);
  }
  const driverPerformance: DriverPerformance[] = drivers
    .map((d) => {
      const stats = driverStats.get(d.id);
      return {
        driverId: d.id,
        name: d.full_name,
        completedRoutes: stats?.completed ?? 0,
        onTimeRoutes: stats?.onTime ?? 0,
      };
    })
    .filter((d) => d.completedRoutes > 0)
    .sort((a, b) => b.completedRoutes - a.completedRoutes);

  // Rendimiento por unidad (distancia total en el periodo + alertas).
  const distanceByTruck = new Map<string, number>();
  for (const [key, { min, max }] of odometerByTruckDay) {
    const truckId = key.split(":")[0]!;
    distanceByTruck.set(truckId, (distanceByTruck.get(truckId) ?? 0) + Math.max(0, max - min));
  }
  const truckPerformance: TruckPerformance[] = trucks
    .map((t) => ({
      truckId: t.id,
      unitNumber: t.unit_number,
      distanceKm: Math.round((distanceByTruck.get(t.id) ?? 0) * 10) / 10,
      alertCount: alertsByTruck.get(t.id) ?? 0,
    }))
    .sort((a, b) => b.distanceKm - a.distanceKm);

  const totalDistanceKm = distanceByDay.reduce((sum, d) => sum + d.distanceKm, 0);
  const totalFuelCost = fuelByDay.reduce((sum, d) => sum + d.cost, 0);

  return {
    distanceByDay,
    fuelByDay,
    routesCompleted: completedRoutes.length,
    onTimeDeliveryPct,
    alertsByType,
    fleetUtilizationPct: utilization,
    avgSpeedKmh: Math.round(average(speeds) * 10) / 10,
    driverPerformance,
    truckPerformance,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    totalFuelCost: Math.round(totalFuelCost * 100) / 100,
  };
}
