"use client";

import { useState } from "react";
import { AlertTriangle, Crosshair, X } from "lucide-react";
import { useAlertsRealtime } from "@/hooks/use-alerts-realtime";
import type { Alert } from "@/types/domain";

export interface RealtimeAlertsBannerProps {
  organizationId: string;
  onFocusTruck?: (truckId: string) => void;
}

export function RealtimeAlertsBanner({ organizationId, onFocusTruck }: RealtimeAlertsBannerProps) {
  const [activeBanner, setActiveBanner] = useState<Alert | null>(null);

  useAlertsRealtime(organizationId, (newAlert) => {
    setActiveBanner(newAlert);
  });

  if (!activeBanner) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-rose-500/50 bg-rose-950/90 p-3.5 text-rose-100 shadow-2xl backdrop-blur-lg animate-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-600/30 text-rose-400 border border-rose-500/40 animate-pulse">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-rose-600 text-white">
                ALERTA EN TIEMPO REAL
              </span>
              <span className="text-xs text-rose-300 font-mono">
                {new Date(activeBanner.detected_at).toLocaleTimeString()}
              </span>
            </div>
            <p className="font-semibold text-sm mt-0.5 text-white">{activeBanner.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeBanner.truck_id ? (
            <button
              onClick={() => onFocusTruck?.(activeBanner.truck_id!)}
              className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition-colors shadow-md"
            >
              <Crosshair className="h-3.5 w-3.5" />
              Enfocar en Mapa
            </button>
          ) : null}
          <button
            onClick={() => setActiveBanner(null)}
            className="rounded-lg p-1.5 text-rose-300 hover:bg-rose-900/60 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
