import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { listAvailableTrucksForRoute } from "@/features/routes/queries";
import { PageHeader } from "@/components/layout/page-header";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";

export const metadata: Metadata = { title: "Registrar mantenimiento" };

export default async function NuevoMantenimientoPage() {
  const ctx = await requireRole(["owner", "admin", "dispatcher"]);
  const trucks = await listAvailableTrucksForRoute(ctx.organization.id);

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Registrar mantenimiento" description="Programa o registra un servicio para una unidad." />
      <MaintenanceForm trucks={trucks.map((t) => ({ id: t.id, label: `${t.unit_number} · ${t.name}` }))} />
    </div>
  );
}
