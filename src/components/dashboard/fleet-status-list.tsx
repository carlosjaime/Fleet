import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { TruckStatusBadge } from "@/components/ui/status-badges";
import { formatSpeed, formatPercent, formatRelativeTime } from "@/lib/utils/format";
import { Truck as TruckIcon } from "lucide-react";
import type { TruckStatus } from "@/types/domain";

export interface FleetSnapshotItem {
  id: string;
  unit_number: string;
  name: string;
  status: TruckStatus;
  last_speed_kmh: number | null;
  current_fuel_pct: number | null;
  last_location_at: string | null;
  driver: { id: string; full_name: string } | null;
}

export function FleetStatusList({ trucks }: { trucks: FleetSnapshotItem[] }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Estado de la flota</h2>
        <Link href="/flota" className="text-xs text-cyan hover:underline">
          Ver todas
        </Link>
      </div>
      {trucks.length === 0 ? (
        <EmptyState icon={TruckIcon} title="Sin unidades" description="Registra tu primera unidad." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted">
              <tr>
                <th className="pb-2 text-left">Unidad</th>
                <th className="pb-2 text-left">Conductor</th>
                <th className="pb-2 text-left">Estado</th>
                <th className="pb-2 text-left">Velocidad</th>
                <th className="pb-2 text-left">Combustible</th>
                <th className="pb-2 text-left">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {trucks.slice(0, 8).map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="py-2">
                    <Link href={`/flota/${t.id}`} className="telemetry font-medium hover:text-cyan">
                      {t.unit_number}
                    </Link>
                  </td>
                  <td className="py-2 text-muted">{t.driver?.full_name ?? "—"}</td>
                  <td className="py-2">
                    <TruckStatusBadge status={t.status} />
                  </td>
                  <td className="py-2">{t.last_speed_kmh != null ? formatSpeed(t.last_speed_kmh) : "—"}</td>
                  <td className="py-2">{t.current_fuel_pct != null ? formatPercent(t.current_fuel_pct) : "—"}</td>
                  <td className="py-2 text-muted">{formatRelativeTime(t.last_location_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
