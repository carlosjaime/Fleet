import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TelemetryIngestInput } from "@/lib/validations/telemetry";
import {
  evaluateRealtimeRules,
  type AlertThresholds,
  type TelemetrySample,
} from "@/lib/telemetry/alert-rules";
import { approximateProgress } from "@/lib/geo";
import type { GeoPoint } from "@/types/domain";

export interface IngestResult {
  truckId: string;
  locationId: string;
  alertsCreated: number;
}

export class IngestError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "IngestError";
  }
}

const DEFAULT_THRESHOLDS: AlertThresholds = {
  speedLimitKmh: 90,
  lowFuelThresholdPct: 20,
  routeDeviationToleranceMeters: 1000,
  delayToleranceMinutes: 15,
  gpsOfflineMinutes: 10,
};

/**
 * Procesa un evento de telemetría GPS: resuelve la unidad, inserta el
 * historial de ubicación, actualiza la posición actual del camión, evalúa
 * las reglas de alertas y actualiza el progreso de la ruta activa si
 * corresponde. Se ejecuta con el cliente de servicio porque no hay sesión
 * de navegador (autenticación por API key de dispositivo).
 */
export async function ingestTelemetry(
  organizationId: string,
  scopedTruckId: string | null,
  input: TelemetryIngestInput,
  source: "device" | "simulator" | "manual" = "device",
): Promise<IngestResult> {
  const admin = createAdminClient();

  const { data: truck, error: truckError } = await admin
    .from("trucks")
    .select("id, status")
    .eq("organization_id", organizationId)
    .eq("unit_number", input.unitNumber)
    .maybeSingle();

  if (truckError) throw new IngestError("INTERNAL_ERROR", "Error al consultar la unidad.");
  if (!truck) throw new IngestError("TRUCK_NOT_FOUND", "La unidad indicada no existe en esta organización.");
  if (scopedTruckId && scopedTruckId !== truck.id) {
    throw new IngestError("TRUCK_MISMATCH", "Esta API key no está autorizada para la unidad indicada.");
  }

  const recordedAt = input.recordedAt ?? new Date().toISOString();

  // Idempotencia razonable: si se envía idempotencyKey y ya existe un
  // registro reciente con la misma clave para esta unidad, no duplicar.
  if (input.idempotencyKey) {
    const { data: existing } = await admin
      .from("truck_locations")
      .select("id")
      .eq("truck_id", truck.id)
      .eq("organization_id", organizationId)
      .contains("metadata", { idempotencyKey: input.idempotencyKey })
      .maybeSingle();

    if (existing) {
      return { truckId: truck.id, locationId: existing.id, alertsCreated: 0 };
    }
  }

  // Ruta activa de la unidad (si existe) para evaluar desviación y progreso.
  const { data: activeRoute } = await admin
    .from("routes")
    .select("id, origin_latitude, origin_longitude, destination_latitude, destination_longitude, scheduled_end_at")
    .eq("organization_id", organizationId)
    .eq("truck_id", truck.id)
    .eq("status", "in_progress")
    .maybeSingle();

  const { data: settingsRow } = await admin
    .from("organization_settings")
    .select("speed_limit_kmh, low_fuel_threshold_pct, route_deviation_tolerance_meters, delay_tolerance_minutes, gps_offline_minutes")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const thresholds: AlertThresholds = settingsRow
    ? {
        speedLimitKmh: settingsRow.speed_limit_kmh,
        lowFuelThresholdPct: settingsRow.low_fuel_threshold_pct,
        routeDeviationToleranceMeters: settingsRow.route_deviation_tolerance_meters,
        delayToleranceMinutes: settingsRow.delay_tolerance_minutes,
        gpsOfflineMinutes: settingsRow.gps_offline_minutes,
      }
    : DEFAULT_THRESHOLDS;

  // 1) Inserta el historial de ubicación.
  const { data: location, error: locationError } = await admin
    .from("truck_locations")
    .insert({
      organization_id: organizationId,
      truck_id: truck.id,
      route_id: activeRoute?.id ?? null,
      latitude: input.latitude,
      longitude: input.longitude,
      speed_kmh: input.speedKmh,
      heading: input.heading,
      fuel_pct: input.fuelPct,
      odometer_km: input.odometerKm,
      accuracy_meters: input.accuracyMeters ?? null,
      recorded_at: recordedAt,
      source,
      metadata: input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {},
    })
    .select("id")
    .single();

  if (locationError || !location) {
    throw new IngestError("INTERNAL_ERROR", "No se pudo registrar la ubicación.");
  }

  // 2) Actualiza la última posición conocida de la unidad.
  await admin
    .from("trucks")
    .update({
      last_latitude: input.latitude,
      last_longitude: input.longitude,
      last_speed_kmh: input.speedKmh,
      last_heading: input.heading,
      current_fuel_pct: input.fuelPct,
      odometer_km: input.odometerKm,
      last_location_at: recordedAt,
      status: truck.status === "offline" ? "active" : truck.status,
    })
    .eq("id", truck.id)
    .eq("organization_id", organizationId);

  // 3) Evento de telemetría genérico.
  await admin.from("telemetry_events").insert({
    organization_id: organizationId,
    truck_id: truck.id,
    route_id: activeRoute?.id ?? null,
    event_type: "location_update",
    severity: "info",
    value: input.speedKmh,
    payload: { latitude: input.latitude, longitude: input.longitude, fuelPct: input.fuelPct },
    recorded_at: recordedAt,
  });

  // 4) Progreso de ruta activa.
  if (activeRoute) {
    const origin: GeoPoint = { latitude: activeRoute.origin_latitude, longitude: activeRoute.origin_longitude };
    const destination: GeoPoint = {
      latitude: activeRoute.destination_latitude,
      longitude: activeRoute.destination_longitude,
    };
    const progress = approximateProgress({ latitude: input.latitude, longitude: input.longitude }, origin, destination);
    await admin
      .from("routes")
      .update({ progress_pct: Math.round(progress * 1000) / 10 })
      .eq("id", activeRoute.id)
      .eq("organization_id", organizationId);
  }

  // 5) Motor de alertas en tiempo real (velocidad, combustible, desviación).
  const sample: TelemetrySample = {
    position: { latitude: input.latitude, longitude: input.longitude },
    speedKmh: input.speedKmh,
    fuelPct: input.fuelPct,
    recordedAt: new Date(recordedAt),
  };
  const routePath: GeoPoint[] = activeRoute
    ? [
        { latitude: activeRoute.origin_latitude, longitude: activeRoute.origin_longitude },
        { latitude: activeRoute.destination_latitude, longitude: activeRoute.destination_longitude },
      ]
    : [];

  const candidates = evaluateRealtimeRules(sample, thresholds, routePath);
  let alertsCreated = 0;

  for (const candidate of candidates) {
    // Evita duplicar alertas abiertas del mismo tipo para la misma unidad.
    const { data: existingAlert } = await admin
      .from("alerts")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("truck_id", truck.id)
      .eq("type", candidate.type)
      .eq("status", "open")
      .maybeSingle();

    if (existingAlert) continue;

    const { error: alertError } = await admin.from("alerts").insert({
      organization_id: organizationId,
      truck_id: truck.id,
      route_id: activeRoute?.id ?? null,
      type: candidate.type,
      severity: candidate.severity,
      title: candidate.title,
      description: candidate.description,
      latitude: input.latitude,
      longitude: input.longitude,
      detected_at: recordedAt,
    });

    if (!alertError) alertsCreated += 1;
  }

  return { truckId: truck.id, locationId: location.id, alertsCreated };
}
