import type { Metadata } from "next";
import { getSessionContext } from "@/lib/auth/session";
import { listDrivers } from "@/features/drivers/queries";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { DriversGrid } from "@/components/drivers/drivers-grid";

export const metadata: Metadata = { title: "Conductores" };

export default async function ConductoresPage() {
  const ctx = await getSessionContext();
  const drivers = await listDrivers(ctx.organization.id);

  const supabase = await createClient();
  const { data: trucks } = await supabase
    .from("trucks")
    .select("unit_number, active_driver_id")
    .eq("organization_id", ctx.organization.id)
    .not("active_driver_id", "is", null);

  const assignments: Record<string, string> = {};
  for (const t of trucks ?? []) {
    if (t.active_driver_id) assignments[t.active_driver_id] = t.unit_number;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conductores"
        description={`${drivers.length} conductor${drivers.length === 1 ? "" : "es"} registrados`}
      />
      <DriversGrid drivers={drivers} assignments={assignments} />
    </div>
  );
}
