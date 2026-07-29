import type { Metadata } from "next";
import Link from "next/link";
import { getSessionContext } from "@/lib/auth/session";
import { listFuelLogs, getFuelStatsByTruck } from "@/features/fuel/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { FuelStatsTable } from "@/components/fuel/fuel-stats-table";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils/format";
import { Fuel as FuelIcon, Plus } from "lucide-react";

export const metadata: Metadata = { title: "Combustible" };

export default async function CombustiblePage() {
  const ctx = await getSessionContext();
  const [logs, stats] = await Promise.all([
    listFuelLogs(ctx.organization.id),
    getFuelStatsByTruck(ctx.organization.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Combustible"
        description="Registra cargas y consulta el rendimiento de tu flotilla."
        actions={
          <PermissionGuard permission="fuel:write">
            <Button asChild>
              <Link href="/combustible/nuevo">
                <Plus className="size-4" /> Registrar carga
              </Link>
            </Button>
          </PermissionGuard>
        }
      />

      <div>
        <h2 className="mb-3 text-sm font-semibold">Rendimiento por unidad</h2>
        <FuelStatsTable stats={stats} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Historial de cargas</h2>
        {logs.length === 0 ? (
          <EmptyState icon={FuelIcon} title="Sin cargas registradas" description="Registra la primera carga de combustible." />
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <Card key={log.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">
                    {log.truck ? `${log.truck.unit_number} · ${log.truck.name}` : "Unidad eliminada"}
                  </p>
                  <p className="text-xs text-muted">
                    {formatNumber(log.liters)} L · {formatCurrency(log.price_per_liter)}/L ·{" "}
                    {log.fuel_station ?? "Estación no especificada"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="telemetry font-semibold">{formatCurrency(log.total_cost)}</p>
                  <p className="text-xs text-muted">{formatDateTime(log.recorded_at)}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
