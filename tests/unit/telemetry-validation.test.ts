import { describe, it, expect } from "vitest";
import { telemetryIngestSchema } from "@/lib/validations/telemetry";

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    unitNumber: "TRK-001",
    latitude: 20.101,
    longitude: -98.759,
    speedKmh: 72,
    heading: 135,
    fuelPct: 64,
    odometerKm: 148250.4,
    recordedAt: new Date().toISOString(),
    accuracyMeters: 8,
    ...overrides,
  };
}

describe("telemetryIngestSchema", () => {
  it("acepta un payload válido", () => {
    const result = telemetryIngestSchema.safeParse(validPayload());
    expect(result.success).toBe(true);
  });

  it("rechaza latitud fuera de rango", () => {
    expect(telemetryIngestSchema.safeParse(validPayload({ latitude: 91 })).success).toBe(false);
    expect(telemetryIngestSchema.safeParse(validPayload({ latitude: -91 })).success).toBe(false);
  });

  it("rechaza longitud fuera de rango", () => {
    expect(telemetryIngestSchema.safeParse(validPayload({ longitude: 181 })).success).toBe(false);
  });

  it("rechaza velocidad negativa o absurda", () => {
    expect(telemetryIngestSchema.safeParse(validPayload({ speedKmh: -5 })).success).toBe(false);
    expect(telemetryIngestSchema.safeParse(validPayload({ speedKmh: 500 })).success).toBe(false);
  });

  it("rechaza combustible fuera de 0-100", () => {
    expect(telemetryIngestSchema.safeParse(validPayload({ fuelPct: -1 })).success).toBe(false);
    expect(telemetryIngestSchema.safeParse(validPayload({ fuelPct: 101 })).success).toBe(false);
  });

  it("rechaza heading fuera de 0-359", () => {
    expect(telemetryIngestSchema.safeParse(validPayload({ heading: 360 })).success).toBe(false);
    expect(telemetryIngestSchema.safeParse(validPayload({ heading: -1 })).success).toBe(false);
  });

  it("acepta heading en los límites válidos", () => {
    expect(telemetryIngestSchema.safeParse(validPayload({ heading: 0 })).success).toBe(true);
    expect(telemetryIngestSchema.safeParse(validPayload({ heading: 359 })).success).toBe(true);
  });

  it("rechaza unitNumber vacío", () => {
    expect(telemetryIngestSchema.safeParse(validPayload({ unitNumber: "" })).success).toBe(false);
  });

  it("rechaza timestamps demasiado antiguos", () => {
    const oldDate = new Date(Date.now() - 48 * 3_600_000).toISOString();
    expect(telemetryIngestSchema.safeParse(validPayload({ recordedAt: oldDate })).success).toBe(false);
  });

  it("rechaza timestamps futuros más allá de la tolerancia", () => {
    const futureDate = new Date(Date.now() + 30 * 60_000).toISOString();
    expect(telemetryIngestSchema.safeParse(validPayload({ recordedAt: futureDate })).success).toBe(false);
  });

  it("recordedAt es opcional", () => {
    const payload = validPayload();
    delete (payload as Record<string, unknown>).recordedAt;
    expect(telemetryIngestSchema.safeParse(payload).success).toBe(true);
  });

  it("rechaza odometerKm negativo", () => {
    expect(telemetryIngestSchema.safeParse(validPayload({ odometerKm: -1 })).success).toBe(false);
  });
});
