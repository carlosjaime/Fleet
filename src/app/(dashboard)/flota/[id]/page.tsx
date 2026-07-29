import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionContext } from "@/lib/auth/session";
import {
  getTruck,
  getTruckLocationHistory,
  getTruckRoutes,
  getTruckMaintenance,
  getTruckFuelLogs,
  getTruckAlerts,
  listAvailableDrivers,
} from "@/features/fleet/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { TruckDetailTabs } from "@/components/fleet/truck-detail-tabs";
import { TruckQuickActions } from "@/components/fleet/truck-quick-actions";
import { TruckStatusBadge } from "@/components/ui/status-badges";
import { formatCoordinate, formatRelativeTime } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Detalle de unidad" };

export default async function TruckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSessionContext();
  const truck = await getTruck(ctx.organization.id, id);
  if (!truck) notFound();

  const [locations, routes, maintenance, fuelLogs, alerts, drivers] = await Promise.all([
    getTruckLocationHistory(ctx.organization.id, id, 50),
    getTruckRoutes(ctx.organization.id, id),
    getTruckMaintenance(ctx.organization.id, id),
    getTruckFuelLogs(ctx.organization.id, id),
    getTruckAlerts(ctx.organization.id, id),
    listAvailableDrivers(ctx.organization.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${truck.unit_number} · ${truck.name}`}
        description={
          truck.last_location_at
            ? `${formatCoordinate(truck.last_latitude ?? 0, truck.last_longitude ?? 0)} · Actualizado ${formatRelativeTime(truck.last_location_at)}`
            : "Sin telemetría reciente"
        }
        actions={
          <>
            <TruckStatusBadge status={truck.status} />
            <PermissionGuard permission="fleet:write">
              <Button asChild variant="outline">
                <Link href={`/flota/${truck.id}/editar`}>Editar</Link>
              </Button>
            </PermissionGuard>
          </>
        }
      />

      <TruckQuickActions truck={truck} drivers={drivers} />

      <TruckDetailTabs
        truck={truck}
        locations={locations}
        routes={routes}
        maintenance={maintenance}
        fuelLogs={fuelLogs}
        alerts={alerts}
      />
    </div>
  );
}
