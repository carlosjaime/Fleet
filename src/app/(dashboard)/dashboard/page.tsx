import type { Metadata } from "next";
import { getSessionContext } from "@/lib/auth/session";
import { getDashboardKpis, getFleetSnapshot, getRecentActivity, getRouteTracks } from "@/features/dashboard/queries";
import { listAlerts } from "@/features/alerts/queries";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DashboardLive } from "@/components/dashboard/dashboard-live";
import { formatKm, formatPercent, formatSpeed } from "@/lib/utils/format";
import {
  Truck as TruckIcon,
  Route as RouteIcon,
  Bell,
  Gauge,
  Fuel,
  Clock,
  MapPinned,
} from "lucide-react";

export const metadata: Metadata = { title: "Centro de control" };

export default async function DashboardPage() {
  const ctx = await getSessionContext();
  const [kpis, fleet, activity, openAlerts, routeTracks] = await Promise.all([
    getDashboardKpis(ctx.organization.id),
    getFleetSnapshot(ctx.organization.id),
    getRecentActivity(ctx.organization.id),
    listAlerts(ctx.organization.id, "open", 50),
    getRouteTracks(ctx.organization.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Centro de control"
        description={`${ctx.organization.name} · Vista operativa en tiempo real`}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Unidades totales" value={kpis.totalTrucks} icon={TruckIcon} accent="cyan" />
        <KpiCard label="Unidades activas" value={kpis.activeTrucks} icon={TruckIcon} accent="success" />
        <KpiCard label="En mantenimiento" value={kpis.maintenanceTrucks} icon={TruckIcon} accent="amber" />
        <KpiCard label="Rutas en progreso" value={kpis.routesInProgress} icon={RouteIcon} accent="info" />
        <KpiCard label="Alertas abiertas" value={kpis.openAlerts} icon={Bell} accent="critical" />
        <KpiCard label="Velocidad promedio" value={formatSpeed(kpis.avgSpeedKmh)} icon={Gauge} accent="muted" />
        <KpiCard label="Combustible promedio" value={formatPercent(kpis.avgFuelPct)} icon={Fuel} accent="amber" />
        <KpiCard label="Entregas a tiempo" value={formatPercent(kpis.onTimeDeliveryPct)} icon={Clock} accent="success" />
        <KpiCard label="Distancia hoy" value={formatKm(kpis.distanceTodayKm)} icon={MapPinned} accent="cyan" />
      </div>

      <DashboardLive
        initialTrucks={fleet.map((t) => ({
          id: t.id,
          unit_number: t.unit_number,
          name: t.name,
          status: t.status,
          last_speed_kmh: t.last_speed_kmh,
          current_fuel_pct: t.current_fuel_pct,
          last_location_at: t.last_location_at,
          driver: t.driver,
        }))}
        initialAlerts={openAlerts.map((a) => ({
          id: a.id,
          type: a.type,
          severity: a.severity,
          title: a.title,
          detected_at: a.detected_at,
          truck: a.truck ? { unit_number: a.truck.unit_number } : null,
        }))}
        routeTracks={routeTracks.map((r) => ({
          id: r.id,
          points: [
            [r.origin_latitude, r.origin_longitude],
            [r.destination_latitude, r.destination_longitude],
          ] as [number, number][],
        }))}
      />

      <ActivityFeed entries={activity} />
    </div>
  );
}
