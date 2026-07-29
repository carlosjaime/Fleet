import { NextResponse, type NextRequest } from "next/server";
import { ok, fail } from "@/lib/utils/api";
import { telemetryIngestSchema } from "@/lib/validations/telemetry";
import { verifyDeviceApiKey, extractBearerToken } from "@/lib/services/device-auth";
import { checkTelemetryRateLimit } from "@/lib/services/rate-limit";
import { ingestTelemetry, IngestError } from "@/lib/services/telemetry-ingest";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;

/**
 * POST /api/telemetry/ingest
 *
 * Recibe telemetría GPS de dispositivos/proveedores externos. Requiere
 * autenticación por API key de dispositivo (Authorization: Bearer <key>).
 * Nunca acepta la clave por query params.
 */
export async function POST(request: NextRequest) {
  try {
    const contentLength = request.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
      return fail("PAYLOAD_TOO_LARGE", "El cuerpo de la solicitud es demasiado grande.", 413);
    }

    const token = extractBearerToken(request.headers.get("authorization"));
    if (!token) {
      return fail("UNAUTHORIZED", "Falta el encabezado Authorization: Bearer <api_key>.", 401);
    }

    const device = await verifyDeviceApiKey(token);
    if (!device) {
      return fail("UNAUTHORIZED", "API key inválida, revocada o expirada.", 401);
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return fail("INVALID_JSON", "El cuerpo de la solicitud no es JSON válido.", 400);
    }

    const parsed = telemetryIngestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return fail("INVALID_TELEMETRY", "Los datos de telemetría no son válidos.", 422, parsed.error.flatten());
    }

    const rateLimit = await checkTelemetryRateLimit(device.organizationId, device.scopedTruckId ?? "");
    if (device.scopedTruckId && !rateLimit.allowed) {
      return fail("RATE_LIMITED", "Se excedió el límite de solicitudes de telemetría.", 429, {
        limit: rateLimit.limit,
      });
    }

    const result = await ingestTelemetry(device.organizationId, device.scopedTruckId, parsed.data);

    return ok({
      truckId: result.truckId,
      locationId: result.locationId,
      alertsCreated: result.alertsCreated,
    });
  } catch (err) {
    if (err instanceof IngestError) {
      const status = err.code === "TRUCK_NOT_FOUND" ? 404 : err.code === "TRUCK_MISMATCH" ? 403 : 500;
      return fail(err.code, err.message, status);
    }
    console.error("[telemetry/ingest] error inesperado", err);
    return fail("INTERNAL_ERROR", "Error interno del servidor.", 500);
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: { code: "METHOD_NOT_ALLOWED", message: "Usa POST para enviar telemetría." } },
    { status: 405 },
  );
}
