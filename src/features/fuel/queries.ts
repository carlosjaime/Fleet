import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { FuelLog } from "@/types/domain";
import { fuelEfficiencyKmPerLiter, costPerKm, average, isAbnormalConsumption } from "@/lib/utils/metrics";

export interface FuelLogWithRelations extends FuelLog {
  truck: { id: string; unit_number: string; name: string } | null;
  driver: { id: string; full_name: string } | null;
}

export async function listFuelLogs(organizationId: string): Promise<FuelLogWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fuel_logs")
    .select("*, truck:trucks(id, unit_number, name), driver:drivers(id, full_name)")
    .eq("organization_id", organizationId)
    .order("recorded_at", { ascending: false })
    .returns<FuelLogWithRelations[]>();

  if (error) throw error;
  return data ?? [];
}

export interface TruckFuelStats {
  truckId: string;
  unitNumber: string;
  totalLiters: number;
  totalCost: number;
  kmPerLiter: number | null;
  costPerKm: number | null;
  abnormal: boolean;
}

/**
 * Calcula estadísticas de consumo por unidad a partir de los logs de
 * combustible y el odómetro reportado en cada carga (distancia = diferencia
 * entre cargas consecutivas ordenadas por fecha).
 */
export async function getFuelStatsByTruck(organizationId: string): Promise<TruckFuelStats[]> {
  const supabase = await createClient();
  const { data: trucks } = await supabase
    .from("trucks")
    .select("id, unit_number")
    .eq("organization_id", organizationId);

  const { data: logs } = await supabase
    .from("fuel_logs")
    .select("truck_id, liters, total_cost, odometer_km, recorded_at")
    .eq("organization_id", organizationId)
    .order("recorded_at", { ascending: true });

  const byTruck = new Map<string, { liters: number; cost: number; odometers: number[] }>();
  for (const log of logs ?? []) {
    const entry = byTruck.get(log.truck_id) ?? { liters: 0, cost: 0, odometers: [] };
    entry.liters += log.liters;
    entry.cost += log.total_cost;
    if (log.odometer_km != null) entry.odometers.push(log.odometer_km);
    byTruck.set(log.truck_id, entry);
  }

  const stats: TruckFuelStats[] = [];
  const efficiencies: number[] = [];

  for (const truck of trucks ?? []) {
    const entry = byTruck.get(truck.id);
    if (!entry || entry.liters === 0) continue;
    const distance =
      entry.odometers.length >= 2 ? Math.max(0, entry.odometers[entry.odometers.length - 1]! - entry.odometers[0]!) : 0;
    const kmL = fuelEfficiencyKmPerLiter(distance, entry.liters);
    const costKm = costPerKm(entry.cost, distance);
    if (kmL != null) efficiencies.push(kmL);
    stats.push({
      truckId: truck.id,
      unitNumber: truck.unit_number,
      totalLiters: Math.round(entry.liters * 100) / 100,
      totalCost: Math.round(entry.cost * 100) / 100,
      kmPerLiter: kmL,
      costPerKm: costKm,
      abnormal: false,
    });
  }

  const fleetAvg = average(efficiencies);
  for (const s of stats) {
    if (s.kmPerLiter != null) {
      s.abnormal = isAbnormalConsumption(s.kmPerLiter, fleetAvg);
    }
  }

  return stats;
}
