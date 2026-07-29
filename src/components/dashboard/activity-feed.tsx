import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { formatRelativeTime } from "@/lib/utils/format";
import { Activity } from "lucide-react";
import type { Json } from "@/types/database.types";

const ACTION_LABELS: Record<string, string> = {
  "route.started": "inició una ruta",
  "route.completed": "completó una ruta",
  "route.cancelled": "canceló una ruta",
  "alert.acknowledged": "reconoció una alerta",
  "alert.resolved": "resolvió una alerta",
  "truck.status_changed": "cambió el estado de una unidad",
  "truck.driver_assigned": "asignó un conductor",
  "fuel.logged": "registró una carga de combustible",
  "maintenance.created": "registró un mantenimiento",
  "maintenance.status_changed": "actualizó un mantenimiento",
  "driver.suspended": "suspendió a un conductor",
  "driver.reactivated": "reactivó a un conductor",
};

export interface ActivityEntry {
  id: string;
  action: string;
  entity_type: string | null;
  created_at: string;
  metadata: Json;
}

export function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold">Feed operacional</h2>
      {entries.length === 0 ? (
        <EmptyState icon={Activity} title="Sin actividad reciente" description="Los eventos operativos aparecerán aquí." />
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => (
            <li key={e.id} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-cyan" />
              <div>
                <p>{ACTION_LABELS[e.action] ?? e.action}</p>
                <p className="text-xs text-muted">{formatRelativeTime(e.created_at)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
