import type { Metadata } from "next";
import { getSessionContext } from "@/lib/auth/session";
import { listRoutes } from "@/features/routes/queries";
import { PageHeader } from "@/components/layout/page-header";
import { RoutesTable } from "@/components/routes/routes-table";

export const metadata: Metadata = { title: "Rutas" };

export default async function RutasPage() {
  const ctx = await getSessionContext();
  const routes = await listRoutes(ctx.organization.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Rutas" description={`${routes.length} ruta${routes.length === 1 ? "" : "s"} registradas`} />
      <RoutesTable routes={routes} />
    </div>
  );
}
