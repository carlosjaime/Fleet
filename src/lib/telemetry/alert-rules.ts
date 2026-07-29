/**
 * Motor de reglas de alertas.
 *
 * Cada regla es una función pura que recibe el contexto de un evento GPS y
 * la configuración de la organización, y decide si debe generarse una alerta.
 * No accede a la base de datos: eso lo hace el orquestador de ingestión.
 */
import type { AlertSeverity, AlertType, GeoPoint } from "@/types/domain";
import { distanceToPath } from "@/lib/geo";

export interface AlertThresholds {
  speedLimitKmh: number;
  lowFuelThresholdPct: number;
  routeDeviationToleranceMeters: number;
  delayToleranceMinutes: number;
  gpsOfflineMinutes: number;
}

export interface TelemetrySample {
  position: GeoPoint;
  speedKmh: number | null;
  fuelPct: number | null;
  recordedAt: Date;
}

export interface CandidateAlert {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  value: number | null;
}

/** Exceso de velocidad. */
export function evaluateSpeeding(
  sample: TelemetrySample,
  thresholds: AlertThresholds,
): CandidateAlert | null {
  if (sample.speedKmh == null) return null;
  if (sample.speedKmh <= thresholds.speedLimitKmh) return null;

  const over = sample.speedKmh - thresholds.speedLimitKmh;
  const severity: AlertSeverity = over > 20 ? "critical" : "warning";
  return {
    type: "speeding",
    severity,
    title: "Exceso de velocidad",
    description: `Velocidad de ${Math.round(sample.speedKmh)} km/h supera el límite de ${thresholds.speedLimitKmh} km/h.`,
    value: sample.speedKmh,
  };
}

/** Combustible bajo. */
export function evaluateLowFuel(
  sample: TelemetrySample,
  thresholds: AlertThresholds,
): CandidateAlert | null {
  if (sample.fuelPct == null) return null;
  if (sample.fuelPct > thresholds.lowFuelThresholdPct) return null;

  const severity: AlertSeverity = sample.fuelPct <= thresholds.lowFuelThresholdPct / 2 ? "critical" : "warning";
  return {
    type: "low_fuel",
    severity,
    title: "Combustible bajo",
    description: `Nivel de combustible en ${Math.round(sample.fuelPct)}% (umbral ${thresholds.lowFuelThresholdPct}%).`,
    value: sample.fuelPct,
  };
}

/** Desviación de ruta respecto a la polilínea conocida. */
export function evaluateRouteDeviation(
  sample: TelemetrySample,
  routePath: readonly GeoPoint[],
  thresholds: AlertThresholds,
): CandidateAlert | null {
  if (routePath.length < 2) return null;
  const distance = distanceToPath(sample.position, routePath);
  if (distance <= thresholds.routeDeviationToleranceMeters) return null;

  return {
    type: "route_deviation",
    severity: "warning",
    title: "Desviación de ruta",
    description: `La unidad está a ${Math.round(distance)} m de la ruta asignada (tolerancia ${thresholds.routeDeviationToleranceMeters} m).`,
    value: Math.round(distance),
  };
}

/** GPS desconectado según la última recepción. */
export function evaluateGpsOffline(
  lastLocationAt: Date | null,
  now: Date,
  thresholds: AlertThresholds,
): CandidateAlert | null {
  if (!lastLocationAt) return null;
  const minutes = (now.getTime() - lastLocationAt.getTime()) / 60_000;
  if (minutes < thresholds.gpsOfflineMinutes) return null;

  return {
    type: "gps_offline",
    severity: "warning",
    title: "GPS desconectado",
    description: `Sin telemetría desde hace ${Math.round(minutes)} minutos.`,
    value: Math.round(minutes),
  };
}

export interface DelayContext {
  scheduledEndAt: Date | null;
  progressPct: number;
  now: Date;
}

/** Retraso: la ruta debería estar casi completa pero no lo está. */
export function evaluateDelay(
  ctx: DelayContext,
  thresholds: AlertThresholds,
): CandidateAlert | null {
  if (!ctx.scheduledEndAt) return null;
  const minutesLate = (ctx.now.getTime() - ctx.scheduledEndAt.getTime()) / 60_000;
  if (minutesLate < thresholds.delayToleranceMinutes) return null;
  if (ctx.progressPct >= 100) return null;

  return {
    type: "delay",
    severity: minutesLate > 60 ? "critical" : "warning",
    title: "Retraso en ruta",
    description: `La ruta lleva ${Math.round(minutesLate)} min de retraso con ${Math.round(ctx.progressPct)}% de avance.`,
    value: Math.round(minutesLate),
  };
}

export interface MaintenanceContext {
  odometerKm: number;
  nextServiceOdometer: number | null;
  nextServiceDate: Date | null;
  now: Date;
  odometerWarningKm?: number;
  dateWarningDays?: number;
}

/** Mantenimiento próximo o vencido. */
export function evaluateMaintenanceDue(ctx: MaintenanceContext): CandidateAlert | null {
  const odoWarn = ctx.odometerWarningKm ?? 1000;
  const dateWarnDays = ctx.dateWarningDays ?? 7;

  if (ctx.nextServiceOdometer != null) {
    const remaining = ctx.nextServiceOdometer - ctx.odometerKm;
    if (remaining <= 0) {
      return {
        type: "maintenance_due",
        severity: "critical",
        title: "Mantenimiento vencido",
        description: `El odómetro (${Math.round(ctx.odometerKm)} km) superó el servicio programado (${Math.round(ctx.nextServiceOdometer)} km).`,
        value: Math.round(remaining),
      };
    }
    if (remaining <= odoWarn) {
      return {
        type: "maintenance_due",
        severity: "warning",
        title: "Mantenimiento próximo",
        description: `Faltan ${Math.round(remaining)} km para el próximo servicio.`,
        value: Math.round(remaining),
      };
    }
  }

  if (ctx.nextServiceDate) {
    const days = (ctx.nextServiceDate.getTime() - ctx.now.getTime()) / 86_400_000;
    if (days <= 0) {
      return {
        type: "maintenance_due",
        severity: "critical",
        title: "Mantenimiento vencido",
        description: `El servicio programado venció hace ${Math.abs(Math.round(days))} día(s).`,
        value: Math.round(days),
      };
    }
    if (days <= dateWarnDays) {
      return {
        type: "maintenance_due",
        severity: "warning",
        title: "Mantenimiento próximo",
        description: `El próximo servicio es en ${Math.round(days)} día(s).`,
        value: Math.round(days),
      };
    }
  }

  return null;
}

/**
 * Evalúa las reglas aplicables a una muestra de telemetría en línea
 * (velocidad, combustible y desviación). Las reglas basadas en tiempo
 * (offline, retraso, mantenimiento) se evalúan por separado en procesos
 * periódicos o al leer el estado.
 */
export function evaluateRealtimeRules(
  sample: TelemetrySample,
  thresholds: AlertThresholds,
  routePath: readonly GeoPoint[] = [],
): CandidateAlert[] {
  const results: CandidateAlert[] = [];
  const speeding = evaluateSpeeding(sample, thresholds);
  if (speeding) results.push(speeding);
  const lowFuel = evaluateLowFuel(sample, thresholds);
  if (lowFuel) results.push(lowFuel);
  const deviation = evaluateRouteDeviation(sample, routePath, thresholds);
  if (deviation) results.push(deviation);
  return results;
}
