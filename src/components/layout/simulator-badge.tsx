"use client";

import { Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGpsSimulator } from "@/components/providers/gps-simulator-provider";

/** Indicador visible de "Modo simulación" cuando el simulador está activo. */
export function SimulatorBadge() {
  const sim = useGpsSimulator();
  if (!sim.enabled) return null;
  return (
    <Badge variant="cyan" aria-live="polite" title="Simulador GPS activo">
      <Radio className="size-3 animate-pulse" />
      Modo simulación{sim.running ? "" : " (pausado)"}
    </Badge>
  );
}
