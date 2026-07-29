import type { Metadata } from "next";
import { getSessionContext } from "@/lib/auth/session";
import { listTrucks } from "@/features/fleet/queries";
import { PageHeader } from "@/components/layout/page-header";
import { TrucksTable } from "@/components/fleet/trucks-table";

export const metadata: Metadata = { title: "Flota" };

export default async function FlotaPage() {
  const ctx = await getSessionContext();
  const trucks = await listTrucks(ctx.organization.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Flota"
        description={`${trucks.length} unidad${trucks.length === 1 ? "" : "es"} registradas`}
      />
      <TrucksTable trucks={trucks} />
    </div>
  );
}
