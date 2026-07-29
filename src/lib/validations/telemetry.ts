import { z } from "zod";
import { latitudeSchema, longitudeSchema } from "./common";

const MAX_PAST_HOURS = 24;
const MAX_FUTURE_MINUTES = 5;

/**
 * Esquema de un evento de telemetría GPS entrante.
 * Rechaza timestamps demasiado antiguos o futuros.
 */
export const telemetryIngestSchema = z.object({
  unitNumber: z.string().min(1, "unitNumber requerido").max(64),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  speedKmh: z.number().min(0).max(400),
  heading: z.number().min(0).max(359),
  fuelPct: z.number().min(0).max(100),
  odometerKm: z.number().min(0).max(10_000_000),
  recordedAt: z
    .string()
    .datetime({ message: "recordedAt debe ser ISO 8601" })
    .refine(
      (value) => {
        const t = new Date(value).getTime();
        const now = Date.now();
        if (t > now + MAX_FUTURE_MINUTES * 60_000) return false;
        if (t < now - MAX_PAST_HOURS * 3_600_000) return false;
        return true;
      },
      { message: "recordedAt fuera del rango temporal permitido" },
    )
    .optional(),
  accuracyMeters: z.number().min(0).max(10_000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  /** Clave de idempotencia opcional para deduplicar reenvíos. */
  idempotencyKey: z.string().max(128).optional(),
});

export type TelemetryIngestInput = z.infer<typeof telemetryIngestSchema>;
