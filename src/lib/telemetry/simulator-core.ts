/**
 * Núcleo puro del simulador GPS. Sin React ni temporizadores: sólo calcula
 * el siguiente estado de una unidad simulada. Se prueba de forma aislada.
 */
import type { GeoPoint } from "@/types/domain";
import { bearing, haversineDistanceKm, interpolate } from "@/lib/geo";

export interface SimUnit {
  id: string;
  name: string;
  unitNumber: string;
  path: GeoPoint[];
  /** Índice del segmento actual dentro de `path`. */
  segment: number;
  /** Progreso [0,1] dentro del segmento actual. */
  segmentT: number;
  position: GeoPoint;
  heading: number;
  speedKmh: number;
  fuelPct: number;
  odometerKm: number;
}

/** Longitud total (km) de una polilínea. */
export function pathLengthKm(path: readonly GeoPoint[]): number {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    total += haversineDistanceKm(path[i]!, path[i + 1]!);
  }
  return total;
}

/**
 * Avanza una unidad simulada `deltaSeconds` segundos. Devuelve un NUEVO objeto
 * (inmutable) con la posición, rumbo, combustible y odómetro actualizados.
 * Al llegar al final de la ruta, reinicia el recorrido (ciclo continuo).
 */
export function advanceUnit(unit: SimUnit, deltaSeconds: number): SimUnit {
  if (unit.path.length < 2) return unit;

  // Variación de velocidad suave y acotada (coherente).
  const jitter = (Math.random() - 0.5) * 6;
  const speedKmh = Math.max(20, Math.min(110, unit.speedKmh + jitter));
  const distanceKm = (speedKmh / 3600) * deltaSeconds;

  let segment = unit.segment;
  let segmentT = unit.segmentT;
  let remainingKm = distanceKm;

  while (remainingKm > 0 && segment < unit.path.length - 1) {
    const a = unit.path[segment]!;
    const b = unit.path[segment + 1]!;
    const segKm = Math.max(haversineDistanceKm(a, b), 1e-6);
    const remainingInSeg = (1 - segmentT) * segKm;

    if (remainingKm < remainingInSeg) {
      segmentT += remainingKm / segKm;
      remainingKm = 0;
    } else {
      remainingKm -= remainingInSeg;
      segment += 1;
      segmentT = 0;
    }
  }

  // Fin de ruta: reiniciar ciclo.
  if (segment >= unit.path.length - 1) {
    segment = 0;
    segmentT = 0;
  }

  const a = unit.path[segment]!;
  const b = unit.path[segment + 1]!;
  const position = interpolate(a, b, segmentT);
  const heading = bearing(a, b);
  const fuelPct = Math.max(0, unit.fuelPct - distanceKm * 0.08);
  const odometerKm = unit.odometerKm + distanceKm;

  return {
    ...unit,
    segment,
    segmentT,
    position,
    heading,
    speedKmh,
    fuelPct: fuelPct <= 0 ? 100 : fuelPct, // recarga simbólica al vaciarse
    odometerKm,
  };
}
