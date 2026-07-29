import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionContext } from "@/lib/auth/session";
import {
  getDriver,
  getDriverAssignedTruck,
  getDriverRoutes,
  getDriverCompletedRoutesCount,
} from "@/features/drivers/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { DriverStatusBadge, RouteStatusBadge } from "@/components/ui/status-badges";
import { DriverQuickActions } from "@/components/drivers/driver-quick-actions";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Detalle de conductor" };

export default async function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSessionContext();
  const driver = await getDriver(ctx.organization.id, id);
  if (!driver) notFound();

  const [assignedTruck, routes, completedCount] = await Promise.all([
    getDriverAssignedTruck(ctx.organization.id, id),
    getDriverRoutes(ctx.organization.id, id),
    getDriverCompletedRoutesCount(ctx.organization.id, id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={driver.full_name}
        description={driver.license_number ? `Licencia ${driver.license_number}` : "Sin licencia registrada"}
        actions={
          <>
            <DriverStatusBadge status={driver.status} />
            <PermissionGuard permission="drivers:write">
              <Button asChild variant="outline">
                <Link href={`/conductores/${driver.id}/editar`}>Editar</Link>
              </Button>
            </PermissionGuard>
          </>
        }
      />

      <DriverQuickActions driver={driver} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase text-muted">Teléfono</p>
          <p className="mt-1 text-sm">{driver.phone ?? "—"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase text-muted">Correo</p>
          <p className="mt-1 text-sm">{driver.email ?? "—"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase text-muted">Vencimiento de licencia</p>
          <p className="mt-1 text-sm">{formatDate(driver.license_expiration)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase text-muted">Unidad asignada</p>
          <p className="mt-1 text-sm">
            {assignedTruck ? `${assignedTruck.unit_number} · ${assignedTruck.name}` : "Sin asignar"}
          </p>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Rutas asignadas</h2>
            <span className="telemetry text-xs text-muted">{completedCount} completadas en total</span>
          </div>
          {routes.length === 0 ? (
            <EmptyState title="Sin rutas" description="Este conductor no tiene rutas asignadas." />
          ) : (
            <ul className="space-y-2">
              {routes.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/rutas/${r.id}`}
                    className="flex items-center justify-between rounded-[var(--radius)] border border-border p-3 hover:bg-surface-elevated"
                  >
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted">
                        {r.origin_name} → {r.destination_name}
                      </p>
                    </div>
                    <RouteStatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
