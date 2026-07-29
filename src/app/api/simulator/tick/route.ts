import { type NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail } from "@/lib/utils/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { ingestTelemetry, IngestError } from "@/lib/services/telemetry-ingest";
import { haversineDistanceKm, interpolate, bearing } from "@/lib/geo";
import { getServerEnv, isGpsSimulatorEnabled } from "@/config/env";
import type { GeoPoint } from "@/types/domain";

export const runtime = "nodejs";

const bodySchema = z.object({
  organizationId: z.string().uuid(),
});

/**
 * POST /api/simulator/tick
 *
 * Endpoint de persistencia OPCIONAL del simulador GPS. A diferencia de la
 * simulación visual (client-only, GpsSimulatorProvider), este endpoint
 * escribe posiciones reales en Supabase para poder probar Realtime,
 * historial y el motor de alertas de punta a punta.
 *
 * - Solo funciona fuera de producción.
 * - Requiere el secreto SIMULATOR_SECRET como Bearer token.
 * - No debe exponerse públicamente ni llamarse automáticamente en Vercel:
 *   se invoca manualmente (o desde un cron controlado) durante pruebas.
 */
export async function POST(request: NextRequest) {
  const { NODE_ENV, SIMULATOR_SECRET } = getServerEnv();

  if (NODE_ENV === "production") {
    return fail("DISABLED_IN_PRODUCTION", "El simulador con persistencia está deshabilitado en producción.", 403);
  }
  if (!isGpsSimulatorEnabled()) {
    return fail("SIMULATOR_DISABLED", "El simulador GPS está deshabilitado.", 403);
  }
  if (!SIMULATOR_SECRET) {
    return fail("NOT_CONFIGURED", "SIMULATOR_SECRET no está configurado en el servidor.", 500);
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token || token !== SIMULATOR_SECRET) {
    return fail("UNAUTHORIZED", "Secreto de simulador inválido.", 401);
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return fail("INVALID_JSON", "El cuerpo de la solicitud no es JSON válido.", 400);
  }

  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return fail("INVALID_INPUT", "organizationId es requerido y debe ser un UUID.", 422, parsed.error.flatten());
  }

  const admin = createAdminClient();
  const { data: routes, error } = await admin
    .from("routes")
    .select("id, truck_id, origin_latitude, origin_longitude, destination_latitude, destination_longitude")
    .eq("organization_id", parsed.data.organizationId)
    .eq("status", "in_progress")
    .not("truck_id", "is", null);

  if (error) return fail("INTERNAL_ERROR", "No se pudieron leer las rutas activas.", 500);
  if (!routes || routes.length === 0) {
    return ok({ ticked: 0, message: "No hay rutas en progreso para simular." });
  }

  let ticked = 0;

  for (const route of routes) {
    if (!route.truck_id) continue;

    const { data: truck } = await admin
      .from("trucks")
      .select("id, unit_number, last_latitude, last_longitude, odometer_km, current_fuel_pct")
      .eq("id", route.truck_id)
      .maybeSingle();

    if (!truck) continue;

    const origin: GeoPoint = { latitude: route.origin_latitude, longitude: route.origin_longitude };
    const destination: GeoPoint = { latitude: route.destination_latitude, longitude: route.destination_longitude };
    const current: GeoPoint =
      truck.last_latitude != null && truck.last_longitude != null
        ? { latitude: truck.last_latitude, longitude: truck.last_longitude }
        : origin;

    const remainingKm = haversineDistanceKm(current, destination);
    if (remainingKm < 0.05) continue; // ya llegó, no mover más

    // Avanza una fracción aleatoria y acotada del tramo restante por tick.
    const step = Math.min(1, (0.03 + Math.random() * 0.05));
    const next = interpolate(current, destination, step);
    const heading = bearing(current, destination);
    const speedKmh = 55 + Math.random() * 40;
    const distanceMoved = haversineDistanceKm(current, next);
    const fuelPct = Math.max(5, (truck.current_fuel_pct ?? 80) - distanceMoved * 0.06);
    const odometerKm = (truck.odometer_km ?? 0) + distanceMoved;

    try {
      await ingestTelemetry(
        parsed.data.organizationId,
        null,
        {
          unitNumber: truck.unit_number,
          latitude: next.latitude,
          longitude: next.longitude,
          speedKmh: Math.round(speedKmh * 10) / 10,
          heading: Math.round(heading),
          fuelPct: Math.round(fuelPct * 10) / 10,
          odometerKm: Math.round(odometerKm * 100) / 100,
          recordedAt: new Date().toISOString(),
        },
        "simulator",
      );
      ticked += 1;
    } catch (err) {
      if (!(err instanceof IngestError)) throw err;
      // Continúa con las demás unidades aunque una falle.
    }
  }

  return ok({ ticked });
}
