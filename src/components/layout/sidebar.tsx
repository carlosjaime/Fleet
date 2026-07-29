"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Truck } from "lucide-react";
import { NAV_ITEMS } from "@/config/navigation";
import { cn } from "@/lib/utils/cn";
import { useOrg } from "@/components/providers/org-provider";
import { RoleBadge } from "@/components/ui/status-badges";
import { RealtimeConnectionBadge } from "./realtime-connection-badge";
import { UserMenu } from "./user-menu";
import { publicEnv } from "@/config/env";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { organization, role } = useOrg();

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Marca */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <span className="flex size-8 items-center justify-center rounded-md bg-amber text-background">
          <Truck className="size-4" />
        </span>
        <span className="font-semibold">{publicEnv.NEXT_PUBLIC_APP_NAME}</span>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Navegación principal">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
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
              {active ? <span className="ml-auto size-1.5 rounded-full bg-cyan" /> : null}
            </Link>
          );
        })}
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
      </div>
    </div>
  );
}
