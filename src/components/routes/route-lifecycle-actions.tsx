"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Play, Pause, PlayCircle, CheckCircle2, XCircle, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { transitionRoute } from "@/features/routes/actions";
import { availableActions, ACTION_LABELS, type RouteAction } from "@/lib/routes/state-machine";
import type { RouteStatus } from "@/types/domain";

const ICONS: Record<RouteAction, React.ComponentType<{ className?: string }>> = {
  schedule: CalendarClock,
  start: Play,
  pause: Pause,
  resume: PlayCircle,
  complete: CheckCircle2,
  cancel: XCircle,
};

export function RouteLifecycleActions({ routeId, status }: { routeId: string; status: RouteStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<RouteAction | null>(null);

  const actions = availableActions(status);
  if (actions.length === 0) return null;

  function runAction(action: RouteAction) {
    startTransition(async () => {
      const res = await transitionRoute(routeId, action);
      if (res.ok) {
        toast.success(`Ruta: ${ACTION_LABELS[action].toLowerCase()}`);
        router.refresh();
      } else {
        toast.error(res.message ?? "No se pudo actualizar la ruta");
      }
      setConfirmAction(null);
    });
  }

  return (
    <PermissionGuard permission="routes:manage">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = ICONS[action];
          const destructive = action === "cancel";
          return (
            <Button
              key={action}
              size="sm"
              variant={destructive ? "destructive" : action === "start" || action === "resume" ? "primary" : "outline"}
              disabled={pending}
              onClick={() => (destructive ? setConfirmAction(action) : runAction(action))}
            >
              <Icon className="size-4" /> {ACTION_LABELS[action]}
            </Button>
          );
        })}
      </div>

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Cancelar ruta"
        description="¿Cancelar esta ruta? Esta acción no se puede deshacer."
        destructive
        confirmLabel="Cancelar ruta"
        loading={pending}
        onConfirm={() => {
          if (confirmAction) runAction(confirmAction);
        }}
      />
    </PermissionGuard>
  );
}
