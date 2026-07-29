import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getRoute, listAvailableTrucksForRoute, listAvailableDriversForRoute } from "@/features/routes/queries";
import { PageHeader } from "@/components/layout/page-header";
import { RouteForm } from "@/components/routes/route-form";

export const metadata: Metadata = { title: "Editar ruta" };

export default async function EditarRutaPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireRole(["owner", "admin", "dispatcher"]);
  const { id } = await params;
  const [route, trucks, drivers] = await Promise.all([
    getRoute(ctx.organization.id, id),
    listAvailableTrucksForRoute(ctx.organization.id),
    listAvailableDriversForRoute(ctx.organization.id),
  ]);
  if (!route) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Editar ruta" description={route.name} />
      <RouteForm
        route={route}
        trucks={trucks.map((t) => ({ id: t.id, label: `${t.unit_number} · ${t.name}` }))}
        drivers={drivers.map((d) => ({ id: d.id, label: d.full_name }))}
      />
    </div>
  );
}
