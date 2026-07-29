import type { Metadata } from "next";
import { getSessionContext } from "@/lib/auth/session";
import { getAnalyticsSummary } from "@/features/analytics/queries";
import { presetToRange, type DateRangePreset } from "@/components/ui/date-range-filter";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DistanceChart, FuelCostChart, AlertsByTypeChart } from "@/components/analytics/analytics-charts";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatKm, formatPercent, formatSpeed } from "@/lib/utils/format";
import { Gauge, Route as RouteIcon, Fuel, TrendingUp, Truck as TruckIcon, Clock } from "lucide-react";

export const metadata: Metadata = { title: "Analítica" };

export default async function AnaliticaPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const preset = (["today", "7d", "30d"].includes(range ?? "") ? range : "7d") as DateRangePreset;
  const { from, to } = presetToRange(preset);

  const ctx = await getSessionContext();
  const summary = await getAnalyticsSummary(ctx.organization.id, {
    from: from.toISOString(),
    to: to.toISOString(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analítica"
        description="Métricas operativas de tu flotilla."
        actions={<DateRangeFilter current={preset} />}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Distancia total" value={formatKm(summary.totalDistanceKm)} icon={RouteIcon} accent="cyan" />
        <KpiCard label="Costo de combustible" value={formatCurrency(summary.totalFuelCost)} icon={Fuel} accent="amber" />
        <KpiCard label="Rutas completadas" value={summary.routesCompleted} icon={TrendingUp} accent="success" />
        <KpiCard label="Entregas a tiempo" value={formatPercent(summary.onTimeDeliveryPct)} icon={Clock} accent="info" />
        <KpiCard label="Utilización de flota" value={formatPercent(summary.fleetUtilizationPct)} icon={TruckIcon} accent="cyan" />
        <KpiCard label="Velocidad promedio" value={formatSpeed(summary.avgSpeedKmh)} icon={Gauge} accent="muted" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DistanceChart data={summary.distanceByDay} />
        <FuelCostChart data={summary.fuelByDay} />
      </div>

      <AlertsByTypeChart data={summary.alertsByType} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Rendimiento por conductor</h2>
          {summary.driverPerformance.length === 0 ? (
            <p className="text-sm text-muted">Sin rutas completadas en el periodo.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted">
                <tr>
                  <th className="pb-2 text-left">Conductor</th>
                  <th className="pb-2 text-left">Completadas</th>
                  <th className="pb-2 text-left">A tiempo</th>
                </tr>
              </thead>
              <tbody>
                {summary.driverPerformance.map((d) => (
                  <tr key={d.driverId} className="border-t border-border">
                    <td className="py-2">{d.name}</td>
                    <td className="py-2">{d.completedRoutes}</td>
                    <td className="py-2">{d.onTimeRoutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Rendimiento por unidad</h2>
          {summary.truckPerformance.length === 0 ? (
            <p className="text-sm text-muted">Sin datos en el periodo.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted">
                <tr>
                  <th className="pb-2 text-left">Unidad</th>
                  <th className="pb-2 text-left">Distancia</th>
                  <th className="pb-2 text-left">Alertas</th>
                </tr>
              </thead>
              <tbody>
                {summary.truckPerformance.map((t) => (
                  <tr key={t.truckId} className="border-t border-border">
                    <td className="telemetry py-2">{t.unitNumber}</td>
                    <td className="py-2">{formatKm(t.distanceKm)}</td>
                    <td className="py-2">{t.alertCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
