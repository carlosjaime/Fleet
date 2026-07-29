"use client";

/**
 * GpsSimulatorProvider — Simulación visual del lado cliente.
 *
 * - Sólo se activa cuando NEXT_PUBLIC_ENABLE_GPS_SIMULATOR=true.
 * - Mueve unidades sobre rutas predefinidas cada ~2.5 s interpolando.
 * - Permite pausar/reanudar y ajustar la velocidad de simulación.
 * - No usa temporizadores en el servidor. No afecta producción cuando la
 *   variable está desactivada (el provider queda inerte).
 *
 * Esta simulación es puramente visual: NO persiste en Supabase. La
 * persistencia opcional vive en POST /api/simulator/tick.
 */
import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { isGpsSimulatorEnabled } from "@/config/env";
import { DEMO_ROUTES } from "@/config/demo-routes";
import { advanceUnit, type SimUnit } from "@/lib/telemetry/simulator-core";

const TICK_MS = 2500;

interface GpsSimulatorContextValue {
  enabled: boolean;
  running: boolean;
  speedMultiplier: number;
  units: SimUnit[];
  toggleRunning: () => void;
  setSpeedMultiplier: (value: number) => void;
}

const GpsSimulatorContext = createContext<GpsSimulatorContextValue | null>(null);

function seedUnits(): SimUnit[] {
  return DEMO_ROUTES.map((r, i) => ({
    id: r.unitNumber,
    name: r.name,
    unitNumber: r.unitNumber,
    path: r.path,
    segment: 0,
    segmentT: (i * 0.17) % 1,
    position: r.path[0]!,
    heading: 0,
    speedKmh: 60 + i * 5,
    fuelPct: 80 - i * 8,
    odometerKm: 100000 + i * 5000,
  }));
}

export function GpsSimulatorProvider({ children }: { children: React.ReactNode }) {
  const enabled = isGpsSimulatorEnabled();
  const [running, setRunning] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [units, setUnits] = useState<SimUnit[]>(() => (enabled ? seedUnits() : []));
  const speedRef = useRef(speedMultiplier);
  useEffect(() => {
    speedRef.current = speedMultiplier;
  }, [speedMultiplier]);

  useEffect(() => {
    if (!enabled || !running) return;
    const interval = setInterval(() => {
      const deltaSeconds = (TICK_MS / 1000) * speedRef.current;
      setUnits((prev) => prev.map((u) => advanceUnit(u, deltaSeconds)));
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [enabled, running]);

  const toggleRunning = useCallback(() => setRunning((r) => !r), []);

  const value = useMemo<GpsSimulatorContextValue>(
    () => ({ enabled, running, speedMultiplier, units, toggleRunning, setSpeedMultiplier }),
    [enabled, running, speedMultiplier, units, toggleRunning],
  );

  return <GpsSimulatorContext.Provider value={value}>{children}</GpsSimulatorContext.Provider>;
}

export function useGpsSimulator(): GpsSimulatorContextValue {
  const ctx = useContext(GpsSimulatorContext);
  if (!ctx) {
    // Fallback inerte si se usa fuera del provider (p. ej. en pruebas).
    return {
      enabled: false,
      running: false,
      speedMultiplier: 1,
      units: [],
      toggleRunning: () => {},
      setSpeedMultiplier: () => {},
    };
  }
  return ctx;
}
