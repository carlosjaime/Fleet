import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Truck, TruckWithDriver } from "@/types/domain";

export async function listTrucks(organizationId: string): Promise<TruckWithDriver[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trucks")
    .select("*, driver:drivers!trucks_active_driver_id_fkey(id, full_name, status)")
    .eq("organization_id", organizationId)
    .order("unit_number", { ascending: true })
    .returns<TruckWithDriver[]>();

  if (error) throw error;
  return data ?? [];
}

export async function getTruck(organizationId: string, truckId: string): Promise<Truck | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trucks")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", truckId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getTruckLocationHistory(
  organizationId: string,
  truckId: string,
  limit = 100,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("truck_locations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("truck_id", truckId)
    .order("recorded_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getTruckRoutes(organizationId: string, truckId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("routes")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("truck_id", truckId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

export async function getTruckMaintenance(organizationId: string, truckId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance_records")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("truck_id", truckId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getTruckFuelLogs(organizationId: string, truckId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fuel_logs")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("truck_id", truckId)
    .order("recorded_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

export async function getTruckAlerts(organizationId: string, truckId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("truck_id", truckId)
    .order("detected_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

export async function listAvailableDrivers(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drivers")
    .select("id, full_name, status")
    .eq("organization_id", organizationId)
    .in("status", ["available", "assigned"])
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
