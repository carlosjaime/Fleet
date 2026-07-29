import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import type { TruckFuelStats } from "@/features/fuel/queries";
import { Gauge } from "lucide-react";

export function FuelStatsTable({ stats }: { stats: TruckFuelStats[] }) {
  if (stats.length === 0) {
    return <EmptyState icon={Gauge} title="Sin datos suficientes" description="Registra al menos dos cargas con odómetro por unidad para calcular rendimiento." />;
  }

  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface-elevated text-xs uppercase text-muted">
          <tr>
            <th className="px-3 py-2 text-left">Unidad</th>
            <th className="px-3 py-2 text-left">Litros totales</th>
            <th className="px-3 py-2 text-left">Gasto total</th>
            <th className="px-3 py-2 text-left">Rendimiento</th>
            <th className="px-3 py-2 text-left">Costo/km</th>
            <th className="px-3 py-2 text-left">Estado</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.truckId} className="border-t border-border">
              <td className="telemetry px-3 py-2">{s.unitNumber}</td>
              <td className="px-3 py-2">{formatNumber(s.totalLiters)} L</td>
              <td className="px-3 py-2">{formatCurrency(s.totalCost)}</td>
              <td className="px-3 py-2">{s.kmPerLiter != null ? `${formatNumber(s.kmPerLiter)} km/L` : "—"}</td>
              <td className="px-3 py-2">{s.costPerKm != null ? formatCurrency(s.costPerKm) : "—"}</td>
              <td className="px-3 py-2">
                {s.abnormal ? <Badge variant="critical">Consumo atípico</Badge> : <Badge variant="success">Normal</Badge>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
