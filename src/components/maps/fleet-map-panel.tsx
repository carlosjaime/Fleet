"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Crosshair, Layers } from "lucide-react";
import type { MapUnit, MapRoutePath } from "./fleet-map";
import type { TruckStatus } from "@/types/domain";
import { useGpsSimulator } from "@/components/providers/gps-simulator-provider";
import { RealtimeConnectionBadge } from "@/components/layout/realtime-connection-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

// Carga dinámica del mapa con SSR deshabilitado (Leaflet requiere window).
const FleetMap = dynamic(() => import("./fleet-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

const LEGEND: { status: TruckStatus; label: string; color: string }[] = [
  { status: "active", label: "Activo", color: "#22C55E" },
  { status: "idle", label: "Inactivo", color: "#9299A6" },
  { status: "maintenance", label: "Mantenimiento", color: "#FFB020" },
  { status: "offline", label: "Sin señal", color: "#EF4444" },
];

export function FleetMapPanel({
  liveUnits,
  routes = [],
}: {
  liveUnits: MapUnit[];
  routes?: MapRoutePath[];
}) {
  const sim = useGpsSimulator();
  const [statusFilter, setStatusFilter] = useState<TruckStatus | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);

  // Une unidades reales con simuladas (por número de unidad).
  const units = useMemo<MapUnit[]>(() => {
    const byNumber = new Map<string, MapUnit>();
    for (const u of liveUnits) byNumber.set(u.unitNumber, u);
    if (sim.enabled) {
      for (const s of sim.units) {
        byNumber.set(s.unitNumber, {
          id: s.id,
          name: s.name,
          unitNumber: s.unitNumber,
          latitude: s.position.latitude,
          longitude: s.position.longitude,
          heading: s.heading,
          speedKmh: Math.round(s.speedKmh),
          fuelPct: Math.round(s.fuelPct),
          status: "active",
          simulated: true,
        });
      }
    }
    const all = Array.from(byNumber.values());
    return statusFilter === "all" ? all : all.filter((u) => u.status === statusFilter);
  }, [liveUnits, sim.enabled, sim.units, statusFilter]);

  const offlineCount = units.filter((u) => u.status === "offline").length;

  return (
    <div className="relative h-[420px] overflow-hidden rounded-[var(--radius)] border border-border md:h-[520px]">
      <FleetMap units={units} routes={routes} selectedUnitId={selected} onSelectUnit={setSelected} />

      {/* Controles superiores */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex items-start justify-between p-3">
        <div className="pointer-events-auto flex flex-wrap items-center gap-1 rounded-[var(--radius)] border border-border bg-surface/90 p-1 backdrop-blur">
          {(["all", "active", "idle", "maintenance", "offline"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded px-2 py-1 text-xs transition-colors",
                statusFilter === s ? "bg-surface-elevated text-foreground" : "text-muted hover:text-foreground",
              )}
            >
              {s === "all" ? "Todos" : LEGEND.find((l) => l.status === s)?.label}
            </button>
          ))}
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <RealtimeConnectionBadge showLabel={false} />
        </div>
      </div>

      {/* Leyenda + estado */}
      <div className="pointer-events-none absolute bottom-0 left-0 z-[1000] flex items-end justify-between gap-2 p-3">
        <div className="pointer-events-auto rounded-[var(--radius)] border border-border bg-surface/90 p-2 backdrop-blur">
          <div className="flex items-center gap-1 text-[11px] font-medium text-muted">
            <Layers className="size-3" /> Leyenda
          </div>
          <ul className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
            {LEGEND.map((l) => (
              <li key={l.status} className="flex items-center gap-1.5 text-[11px]">
                <span className="size-2 rounded-full" style={{ background: l.color }} />
                {l.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {offlineCount > 0 ? (
        <div className="pointer-events-none absolute bottom-3 right-3 z-[1000]">
          <span className="pointer-events-auto inline-flex items-center gap-1 rounded-md border border-critical/30 bg-critical/10 px-2 py-1 text-[11px] text-critical">
            <Crosshair className="size-3" /> {offlineCount} sin señal
          </span>
        </div>
      ) : null}
    </div>
  );
}
