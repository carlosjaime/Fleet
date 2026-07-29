import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { listAvailableTrucksForRoute, listAvailableDriversForRoute } from "@/features/routes/queries";
import { PageHeader } from "@/components/layout/page-header";
import { FuelLogForm } from "@/components/fuel/fuel-log-form";

export const metadata: Metadata = { title: "Registrar carga de combustible" };

export default async function NuevaCargaPage() {
  const ctx = await requireRole(["owner", "admin", "dispatcher", "operator"]);
  const [trucks, drivers] = await Promise.all([
    listAvailableTrucksForRoute(ctx.organization.id),
    listAvailableDriversForRoute(ctx.organization.id),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Registrar carga de combustible" />
      <FuelLogForm
        trucks={trucks.map((t) => ({ id: t.id, label: `${t.unit_number} · ${t.name}` }))}
        drivers={drivers.map((d) => ({ id: d.id, label: d.full_name }))}
      />
    </div>
  );
}
