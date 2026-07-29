import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionContext } from "@/lib/auth/session";
import { getRoute, getRouteWaypoints, getRouteActivity } from "@/features/routes/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { RouteStatusBadge } from "@/components/ui/status-badges";
import { RouteLifecycleActions } from "@/components/routes/route-lifecycle-actions";
import { formatCoordinate, formatDateTime, formatKm, formatPercent } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Detalle de ruta" };

const ACTIVITY_LABELS: Record<string, string> = {
  "route.created": "Ruta creada",
  "route.updated": "Ruta actualizada",
  "route.scheduled": "Ruta programada",
  "route.started": "Ruta iniciada",
  "route.paused": "Ruta pausada",
  "route.resumed": "Ruta reanudada",
  "route.completed": "Ruta completada",
  "route.cancelled": "Ruta cancelada",
};

export default async function RouteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSessionContext();
  const route = await getRoute(ctx.organization.id, id);
  if (!route) notFound();

  const [waypoints, activity] = await Promise.all([
    getRouteWaypoints(ctx.organization.id, id),
    getRouteActivity(ctx.organization.id, id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={route.name}
        description={`${route.origin_name} → ${route.destination_name}`}
        actions={
          <>
            <RouteStatusBadge status={route.status} />
            <PermissionGuard permission="routes:write">
              <Button asChild variant="outline">
                <Link href={`/rutas/${route.id}/editar`}>Editar</Link>
              </Button>
            </PermissionGuard>
          </>
        }
      />

      <RouteLifecycleActions routeId={route.id} status={route.status} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase text-muted">Unidad</p>
          <p className="mt-1 text-sm">{route.truck ? `${route.truck.unit_number} · ${route.truck.name}` : "Sin asignar"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase text-muted">Conductor</p>
          <p className="mt-1 text-sm">{route.driver?.full_name ?? "Sin asignar"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase text-muted">Progreso</p>
          <p className="mt-1 text-sm">{formatPercent(route.progress_pct)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase text-muted">Distancia estimada</p>
          <p className="mt-1 text-sm">{route.estimated_distance_km ? formatKm(route.estimated_distance_km) : "—"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase text-muted">Origen</p>
          <p className="telemetry mt-1 text-sm">{formatCoordinate(route.origin_latitude, route.origin_longitude)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase text-muted">Destino</p>
          <p className="telemetry mt-1 text-sm">{formatCoordinate(route.destination_latitude, route.destination_longitude)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase text-muted">Inicio real</p>
          <p className="mt-1 text-sm">{formatDateTime(route.actual_start_at)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase text-muted">Fin real</p>
          <p className="mt-1 text-sm">{formatDateTime(route.actual_end_at)}</p>
        </Card>
      </div>

      {waypoints.length > 0 ? (
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Waypoints</h2>
            <ol className="space-y-2">
              {waypoints.map((w) => (
                <li key={w.id} className="flex items-center justify-between rounded-[var(--radius)] border border-border p-3">
                  <div>
                    <p className="font-medium">
                      {w.sequence + 1}. {w.name}
                    </p>
                    <p className="telemetry text-xs text-muted">{formatCoordinate(w.latitude, w.longitude)}</p>
                  </div>
                  <span className="text-xs capitalize text-muted">{w.status}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Historial de eventos</h2>
          {activity.length === 0 ? (
            <EmptyState title="Sin eventos" description="Todavía no hay eventos registrados para esta ruta." />
          ) : (
            <ul className="space-y-2">
              {activity.map((a) => (
                <li key={a.id} className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0">
                  <span>{ACTIVITY_LABELS[a.action] ?? a.action}</span>
                  <span className="text-xs text-muted">{formatDateTime(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
