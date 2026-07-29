"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "@/config/navigation";
import { cn } from "@/lib/utils/cn";
import { useOrg } from "@/components/providers/org-provider";
import { RoleBadge } from "@/components/ui/status-badges";
import { RealtimeConnectionBadge } from "./realtime-connection-badge";
import { UserMenu } from "./user-menu";
import { BrandLogo } from "@/components/brand/logo";
import { DevHiveCredit } from "@/components/brand/devhive-credit";

export function Sidebar({
  onNavigate,
  openAlertsCount = 0,
}: {
  onNavigate?: () => void;
  openAlertsCount?: number;
}) {
  const pathname = usePathname();
  const { organization, role } = useOrg();

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Marca */}
      <div className="flex h-14 items-center border-b border-border px-4">
        <BrandLogo size={28} textClassName="text-base" />
      </div>

      {/* Navegación agrupada: Operación (uso constante) vs. Gestión
          (consulta periódica) — ayuda a ubicar una sección de un vistazo
          en vez de escanear una lista plana de 9 ítems. */}
      <nav className="flex-1 space-y-4 overflow-y-auto p-3" aria-label="Navegación principal">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-muted/70">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              const isAlerts = item.href === "/alertas";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-surface-elevated text-foreground"
                      : "text-muted hover:bg-surface-elevated/60 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                  {isAlerts && openAlertsCount > 0 ? (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-critical px-1.5 text-[11px] font-semibold text-white">
                      {openAlertsCount > 99 ? "99+" : openAlertsCount}
                    </span>
                  ) : active ? (
                    <span className="ml-auto size-1.5 rounded-full bg-cyan" />
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Pie: organización, rol, conexión, usuario */}
      <div className="space-y-3 border-t border-border p-3">
        <div className="rounded-[var(--radius)] border border-border bg-surface-elevated p-3">
          <p className="truncate text-sm font-medium">{organization.name}</p>
          <div className="mt-2 flex items-center justify-between">
            <RoleBadge role={role} />
            <RealtimeConnectionBadge showLabel={false} />
          </div>
        </div>
        <UserMenu />
        <div className="flex items-center justify-between px-1">
          <DevHiveCredit size={16} />
          <Link href="/acerca-de" className="text-xs text-muted hover:text-foreground">
            Acerca de
          </Link>
        </div>
      </div>
    </div>
  );
}
