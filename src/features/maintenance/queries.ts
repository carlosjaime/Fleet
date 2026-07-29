import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MaintenanceRecord } from "@/types/domain";

export interface MaintenanceWithTruck extends MaintenanceRecord {
  truck: { id: string; unit_number: string; name: string } | null;
}

export async function listMaintenanceRecords(organizationId: string): Promise<MaintenanceWithTruck[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance_records")
    .select("*, truck:trucks(id, unit_number, name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .returns<MaintenanceWithTruck[]>();

  if (error) throw error;
  return data ?? [];
}

export interface MaintenanceKpis {
  inMaintenance: number;
  pending: number;
  overdue: number;
  upcoming: number;
  monthCost: number;
}

export async function getMaintenanceKpis(organizationId: string): Promise<MaintenanceKpis> {
  const supabase = await createClient();

  const [{ count: inMaintenance }, records] = await Promise.all([
    supabase
      .from("trucks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "maintenance"),
    supabase
      .from("maintenance_records")
      .select("status, cost, created_at, scheduled_at")
      .eq("organization_id", organizationId),
  ]);

  const data = records.data ?? [];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let pending = 0;
  let overdue = 0;
  let upcoming = 0;
  let monthCost = 0;

  for (const r of data) {
    if (r.status === "scheduled" || r.status === "in_progress") pending += 1;
    if (r.status === "overdue") overdue += 1;
    if (r.status === "scheduled" && r.scheduled_at) {
      const days = (new Date(r.scheduled_at).getTime() - now.getTime()) / 86_400_000;
      if (days >= 0 && days <= 7) upcoming += 1;
    }
    if (r.status === "completed" && r.cost && new Date(r.created_at) >= monthStart) {
      monthCost += r.cost;
    }
  }

  return { inMaintenance: inMaintenance ?? 0, pending, overdue, upcoming, monthCost };
}
