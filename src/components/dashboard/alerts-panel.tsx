"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, CheckCheck, Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { AlertSeverityBadge } from "@/components/ui/status-badges";
import { acknowledgeAlert, resolveAlert } from "@/features/alerts/actions";
import { formatRelativeTime } from "@/lib/utils/format";
import type { AlertSeverity } from "@/types/domain";

const SEVERITY_ORDER: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

export interface DashboardAlert {
  id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  detected_at: string;
  truck: { unit_number: string } | null;
}

export function AlertsPanel({ alerts }: { alerts: DashboardAlert[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const sorted = [...alerts].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]).slice(0, 8);

  function handleAcknowledge(id: string) {
    setBusyId(id);
    startTransition(async () => {
      const res = await acknowledgeAlert(id);
      if (res.ok) {
        toast.success("Alerta reconocida");
        router.refresh();
      } else toast.error(res.message ?? "No se pudo reconocer");
      setBusyId(null);
    });
  }

  function handleResolve(id: string) {
    setBusyId(id);
    startTransition(async () => {
      const res = await resolveAlert(id);
      if (res.ok) {
        toast.success("Alerta resuelta");
        router.refresh();
      } else toast.error(res.message ?? "No se pudo resolver");
      setBusyId(null);
    });
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Alertas abiertas</h2>
        <Link href="/alertas" className="text-xs text-cyan hover:underline">
          Ver todas
        </Link>
      </div>
      {sorted.length === 0 ? (
        <EmptyState icon={Bell} title="Sin alertas abiertas" description="Todo está operando con normalidad." />
      ) : (
        <ul className="space-y-2">
          {sorted.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 rounded-[var(--radius)] border border-border p-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <AlertSeverityBadge severity={a.severity} />
                  <p className="truncate text-sm">{a.title}</p>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {a.truck ? `Unidad ${a.truck.unit_number} · ` : ""}
                  {formatRelativeTime(a.detected_at)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <PermissionGuard permission="alerts:acknowledge">
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-8"
                    onClick={() => handleAcknowledge(a.id)}
                    disabled={pending && busyId === a.id}
                    aria-label="Reconocer"
                  >
                    <Check className="size-3.5" />
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission="alerts:resolve">
                  <Button
                    size="icon"
                    className="size-8"
                    onClick={() => handleResolve(a.id)}
                    disabled={pending && busyId === a.id}
                    aria-label="Resolver"
                  >
                    <CheckCheck className="size-3.5" />
                  </Button>
                </PermissionGuard>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
