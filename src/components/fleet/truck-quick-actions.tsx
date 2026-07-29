"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Wrench, UserPlus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { changeTruckStatus, assignDriverToTruck, deleteTruck } from "@/features/fleet/actions";
import { useRouter } from "next/navigation";
import type { Truck } from "@/types/domain";

const NONE = "__none__";

export function TruckQuickActions({
  truck,
  drivers,
}: {
  truck: Truck;
  drivers: { id: string; full_name: string; status: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleStatus(value: string) {
    startTransition(async () => {
      const res = await changeTruckStatus(truck.id, value);
      if (res.ok) {
        toast.success("Estado actualizado");
        router.refresh();
      } else {
        toast.error(res.message ?? "No se pudo cambiar el estado");
      }
    });
  }

  function handleDriver(value: string) {
    startTransition(async () => {
      const res = await assignDriverToTruck(truck.id, value === NONE ? null : value);
      if (res.ok) {
        toast.success("Conductor actualizado");
        router.refresh();
      } else {
        toast.error(res.message ?? "No se pudo asignar el conductor");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteTruck(truck.id);
      if (res.ok) {
        toast.success("Unidad eliminada");
        router.push("/flota");
      } else {
        toast.error(res.message ?? "No se pudo eliminar la unidad");
      }
      setConfirmDelete(false);
    });
  }

  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="grid gap-3 sm:grid-cols-2">
        <PermissionGuard permission="fleet:write">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Cambiar estado</label>
            <Select value={truck.status} onValueChange={handleStatus} disabled={pending}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="idle">Inactivo</SelectItem>
                <SelectItem value="maintenance">
                  <span className="inline-flex items-center gap-1"><Wrench className="size-3" /> Mantenimiento</span>
                </SelectItem>
                <SelectItem value="offline">Sin señal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </PermissionGuard>

        <PermissionGuard permission="fleet:write">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Asignar conductor</label>
            <Select
              value={truck.active_driver_id ?? NONE}
              onValueChange={handleDriver}
              disabled={pending}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sin asignar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>
                  <span className="inline-flex items-center gap-1"><UserPlus className="size-3" /> Sin asignar</span>
                </SelectItem>
                {drivers
                  .filter((d) => d.status !== "suspended")
                  .map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.full_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </PermissionGuard>
      </div>

      <PermissionGuard permission="fleet:delete">
        <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)} disabled={pending}>
          <Trash2 className="size-4" /> Eliminar unidad
        </Button>
      </PermissionGuard>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Eliminar unidad"
        description={`¿Eliminar ${truck.unit_number}? Esta acción no se puede deshacer.`}
        destructive
        confirmLabel="Eliminar"
        loading={pending}
        onConfirm={handleDelete}
      />
    </Card>
  );
}
