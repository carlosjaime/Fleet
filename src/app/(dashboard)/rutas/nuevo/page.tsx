import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { listAvailableTrucksForRoute, listAvailableDriversForRoute } from "@/features/routes/queries";
import { PageHeader } from "@/components/layout/page-header";
import { RouteForm } from "@/components/routes/route-form";

export const metadata: Metadata = { title: "Nueva ruta" };

export default async function NuevaRutaPage() {
  const ctx = await requireRole(["owner", "admin", "dispatcher"]);
  const [trucks, drivers] = await Promise.all([
    listAvailableTrucksForRoute(ctx.organization.id),
    listAvailableDriversForRoute(ctx.organization.id),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Nueva ruta" description="Programa una ruta y asigna unidad y conductor." />
      <RouteForm
        trucks={trucks.map((t) => ({ id: t.id, label: `${t.unit_number} · ${t.name}` }))}
        drivers={drivers.map((d) => ({ id: d.id, label: d.full_name }))}
      />
    </div>
  );
}
