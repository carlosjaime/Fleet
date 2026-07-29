import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Alert, AlertStatus } from "@/types/domain";

export interface AlertWithRelations extends Alert {
  truck: { id: string; unit_number: string; name: string } | null;
  driver: { id: string; full_name: string } | null;
  route: { id: string; name: string } | null;
}

export async function listAlerts(
  organizationId: string,
  status?: AlertStatus,
  limit = 200,
): Promise<AlertWithRelations[]> {
  const supabase = await createClient();
  let query = supabase
    .from("alerts")
    .select("*, truck:trucks(id, unit_number, name), driver:drivers(id, full_name), route:routes(id, name)")
    .eq("organization_id", organizationId)
    .order("detected_at", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);

  const { data, error } = await query.returns<AlertWithRelations[]>();
  if (error) throw error;
  return data ?? [];
}

export async function getOpenAlertsCount(organizationId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("alerts")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "open");

  if (error) throw error;
  return count ?? 0;
}
