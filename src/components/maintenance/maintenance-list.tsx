"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Wrench, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { MaintenanceStatusBadge } from "@/components/ui/status-badges";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { updateMaintenanceStatus } from "@/features/maintenance/actions";
import { formatCurrency, formatDate, formatDateTime, formatKm } from "@/lib/utils/format";
import type { MaintenanceWithTruck } from "@/features/maintenance/queries";

const TYPE_LABELS: Record<string, string> = {
  preventive: "Preventivo",
  corrective: "Correctivo",
  inspection: "Inspección",
};

export function MaintenanceList({ records }: { records: MaintenanceWithTruck[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function updateStatus(id: string, status: "scheduled" | "in_progress" | "completed" | "cancelled") {
    startTransition(async () => {
      const res = await updateMaintenanceStatus(id, status);
      if (res.ok) {
        toast.success("Estado actualizado");
        router.refresh();
      } else {
        toast.error(res.message ?? "No se pudo actualizar");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <PermissionGuard permission="maintenance:write">
          <Button onClick={() => router.push("/mantenimiento/nuevo")}>
            <Plus className="size-4" /> Registrar mantenimiento
          </Button>
        </PermissionGuard>
      </div>

      {records.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Sin mantenimientos"
          description="Aún no hay registros de mantenimiento para tu flotilla."
        />
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{r.truck ? `${r.truck.unit_number} · ${r.truck.name}` : "Unidad eliminada"}</p>
                  <MaintenanceStatusBadge status={r.status} />
                  <span className="text-xs text-muted">{TYPE_LABELS[r.type]}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{r.description || "Sin descripción"}</p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted">
                  {r.scheduled_at ? <span>Programado: {formatDateTime(r.scheduled_at)}</span> : null}
                  {r.cost ? <span>{formatCurrency(r.cost)}</span> : null}
                  {r.next_service_date ? <span>Próximo: {formatDate(r.next_service_date)}</span> : null}
                  {r.odometer_at_service ? <span>{formatKm(r.odometer_at_service)}</span> : null}
                </div>
              </div>
              <PermissionGuard permission="maintenance:write">
                <Select
                  value={r.status}
                  onValueChange={(v) => updateStatus(r.id, v as "scheduled" | "in_progress" | "completed" | "cancelled")}
                  disabled={pending}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Programado</SelectItem>
                    <SelectItem value="in_progress">En proceso</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </PermissionGuard>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
