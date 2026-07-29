import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Driver } from "@/types/domain";

export async function listDrivers(organizationId: string): Promise<Driver[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drivers")
    .select("*")
    .eq("organization_id", organizationId)
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getDriver(organizationId: string, driverId: string): Promise<Driver | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drivers")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", driverId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getDriverAssignedTruck(organizationId: string, driverId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trucks")
    .select("id, unit_number, name, status")
    .eq("organization_id", organizationId)
    .eq("active_driver_id", driverId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getDriverRoutes(organizationId: string, driverId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("routes")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("driver_id", driverId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

export async function getDriverCompletedRoutesCount(organizationId: string, driverId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("routes")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("driver_id", driverId)
    .eq("status", "completed");

  if (error) throw error;
  return count ?? 0;
}
