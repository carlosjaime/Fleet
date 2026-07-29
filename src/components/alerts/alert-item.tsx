"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, MapPin, Check, CheckCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertSeverityBadge, AlertStatusBadge } from "@/components/ui/status-badges";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { acknowledgeAlert, resolveAlert } from "@/features/alerts/actions";
import { formatDateTime, formatCoordinate } from "@/lib/utils/format";
import type { AlertWithRelations } from "@/features/alerts/queries";

const TYPE_LABELS: Record<string, string> = {
  speeding: "Exceso de velocidad",
  route_deviation: "Desviación de ruta",
  low_fuel: "Combustible bajo",
  delay: "Retraso",
  gps_offline: "GPS desconectado",
  maintenance_due: "Mantenimiento próximo",
  unauthorized_stop: "Parada no autorizada",
};

export function AlertItem({ alert }: { alert: AlertWithRelations }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showResolve, setShowResolve] = useState(false);
  const [notes, setNotes] = useState("");

  function handleAcknowledge() {
    startTransition(async () => {
      const res = await acknowledgeAlert(alert.id);
      if (res.ok) {
        toast.success("Alerta reconocida");
        router.refresh();
      } else {
        toast.error(res.message ?? "No se pudo reconocer la alerta");
      }
    });
  }

  function handleResolve() {
    startTransition(async () => {
      const res = await resolveAlert(alert.id, notes);
      if (res.ok) {
        toast.success("Alerta resuelta");
        setShowResolve(false);
        router.refresh();
      } else {
        toast.error(res.message ?? "No se pudo resolver la alerta");
      }
    });
  }

  const critical = alert.severity === "critical";

  return (
    <Card className={critical ? "border-critical/40 p-4" : "p-4"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={critical ? "mt-0.5 text-critical" : "mt-0.5 text-muted"}>
            <AlertTriangle className="size-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{alert.title || TYPE_LABELS[alert.type]}</p>
              <AlertSeverityBadge severity={alert.severity} />
              <AlertStatusBadge status={alert.status} />
            </div>
            <p className="mt-1 text-sm text-muted">{alert.description}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              <span>{formatDateTime(alert.detected_at)}</span>
              {alert.truck ? (
                <Link href={`/flota/${alert.truck.id}`} className="hover:text-cyan">
                  Unidad {alert.truck.unit_number}
                </Link>
              ) : null}
              {alert.driver ? <span>{alert.driver.full_name}</span> : null}
              {alert.route ? (
                <Link href={`/rutas/${alert.route.id}`} className="hover:text-cyan">
                  Ruta: {alert.route.name}
                </Link>
              ) : null}
              {alert.latitude != null && alert.longitude != null ? (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" /> {formatCoordinate(alert.latitude, alert.longitude)}
                </span>
              ) : null}
            </div>
            {alert.status === "resolved" && alert.resolution_notes ? (
              <p className="mt-2 rounded-md bg-surface-elevated p-2 text-xs text-muted">
                Nota de resolución: {alert.resolution_notes}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          {alert.status === "open" ? (
            <PermissionGuard permission="alerts:acknowledge">
              <Button size="sm" variant="outline" onClick={handleAcknowledge} disabled={pending}>
                <Check className="size-4" /> Reconocer
              </Button>
            </PermissionGuard>
          ) : null}
          {alert.status !== "resolved" ? (
            <PermissionGuard permission="alerts:resolve">
              <Button size="sm" onClick={() => setShowResolve((v) => !v)} disabled={pending}>
                <CheckCheck className="size-4" /> Resolver
              </Button>
            </PermissionGuard>
          ) : null}
        </div>
      </div>

      {showResolve ? (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <Textarea
            placeholder="Nota de resolución (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleResolve} disabled={pending}>
              Confirmar resolución
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowResolve(false)} disabled={pending}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
