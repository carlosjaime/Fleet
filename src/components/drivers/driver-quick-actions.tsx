"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, RotateCcw, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { suspendDriver, reactivateDriver, deleteDriver } from "@/features/drivers/actions";
import type { Driver } from "@/types/domain";

export function DriverQuickActions({ driver }: { driver: Driver }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function toggleSuspend() {
    startTransition(async () => {
      const res =
        driver.status === "suspended" ? await reactivateDriver(driver.id) : await suspendDriver(driver.id);
      if (res.ok) {
        toast.success(driver.status === "suspended" ? "Conductor reactivado" : "Conductor suspendido");
        router.refresh();
      } else {
        toast.error(res.message ?? "No se pudo actualizar el conductor");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteDriver(driver.id);
      if (res.ok) {
        toast.success("Conductor eliminado");
        router.push("/conductores");
      } else {
        toast.error(res.message ?? "No se pudo eliminar el conductor");
      }
      setConfirmDelete(false);
    });
  }

  return (
    <Card className="flex flex-wrap items-center gap-2 p-4">
      <PermissionGuard permission="drivers:write">
        <Button variant="outline" size="sm" onClick={toggleSuspend} disabled={pending}>
          {driver.status === "suspended" ? (
            <>
              <RotateCcw className="size-4" /> Reactivar
            </>
          ) : (
            <>
              <Ban className="size-4" /> Suspender
            </>
          )}
        </Button>
      </PermissionGuard>
      <PermissionGuard permission="drivers:delete">
        <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)} disabled={pending}>
          <Trash2 className="size-4" /> Eliminar
        </Button>
      </PermissionGuard>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Eliminar conductor"
        description={`¿Eliminar a ${driver.full_name}? Esta acción no se puede deshacer.`}
        destructive
        confirmLabel="Eliminar"
        loading={pending}
        onConfirm={handleDelete}
      />
    </Card>
  );
}
