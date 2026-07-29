"use client";

import Link from "next/link";
import { Phone, IdCard, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DriverStatusBadge } from "@/components/ui/status-badges";
import { formatDate } from "@/lib/utils/format";
import type { Driver } from "@/types/domain";

function initials(name: string): string {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function isLicenseExpiringSoon(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const days = (new Date(dateStr).getTime() - Date.now()) / 86_400_000;
  return days >= 0 && days <= 30;
}

function isLicenseExpired(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

export function DriverCard({
  driver,
  assignedUnit,
  completedRoutes,
}: {
  driver: Driver;
  assignedUnit?: string | null;
  completedRoutes?: number;
}) {
  const expiringSoon = isLicenseExpiringSoon(driver.license_expiration);
  const expired = isLicenseExpired(driver.license_expiration);

  return (
    <Link href={`/conductores/${driver.id}`}>
      <Card className="h-full space-y-3 p-4 transition-colors hover:border-cyan/40">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Avatar className="size-11">
              <AvatarFallback>{initials(driver.full_name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium leading-tight">{driver.full_name}</p>
              <DriverStatusBadge status={driver.status} />
            </div>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-muted">
          <p className="flex items-center gap-1.5">
            <IdCard className="size-3.5" />
            {driver.license_type ? `Licencia ${driver.license_type}` : "Sin licencia registrada"}
          </p>
          {driver.phone ? (
            <p className="flex items-center gap-1.5">
              <Phone className="size-3.5" />
              {driver.phone}
            </p>
          ) : null}
          {driver.license_expiration ? (
            <p
              className={
                expired
                  ? "flex items-center gap-1.5 text-critical"
                  : expiringSoon
                    ? "flex items-center gap-1.5 text-amber"
                    : "flex items-center gap-1.5"
              }
            >
              {(expired || expiringSoon) && <AlertTriangle className="size-3.5" />}
              Vence {formatDate(driver.license_expiration)}
              {expired ? " (vencida)" : expiringSoon ? " (próxima)" : ""}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
          <span className="text-muted">{assignedUnit ? `Unidad ${assignedUnit}` : "Sin unidad"}</span>
          {completedRoutes != null ? (
            <span className="telemetry text-muted">{completedRoutes} rutas completadas</span>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}
