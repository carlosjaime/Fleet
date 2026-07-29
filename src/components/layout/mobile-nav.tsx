"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Truck, Route as RouteIcon, Bell, Menu } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const PRIMARY = [
  { label: "Control", href: "/dashboard", icon: LayoutDashboard },
  { label: "Flota", href: "/flota", icon: Truck },
  { label: "Rutas", href: "/rutas", icon: RouteIcon },
  { label: "Alertas", href: "/alertas", icon: Bell },
];

/** Navegación inferior para móvil. El botón "Más" abre el sidebar completo. */
export function MobileNav({
  onMore,
  openAlertsCount = 0,
}: {
  onMore: () => void;
  openAlertsCount?: number;
}) {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface md:hidden"
      aria-label="Navegación móvil"
    >
      {PRIMARY.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        const isAlerts = item.href === "/alertas";
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[11px]",
              active ? "text-cyan" : "text-muted",
            )}
          >
            <span className="relative">
              <Icon className="size-5" />
              {isAlerts && openAlertsCount > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-critical text-[9px] font-semibold text-white">
                  {openAlertsCount > 9 ? "9+" : openAlertsCount}
                </span>
              ) : null}
            </span>
            {item.label}
          </Link>
        );
      })}
      <button
        onClick={onMore}
        className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[11px] text-muted"
        aria-label="Más secciones"
      >
        <Menu className="size-5" />
        Más
      </button>
    </nav>
  );
}
