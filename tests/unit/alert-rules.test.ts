import { describe, it, expect } from "vitest";
import {
  evaluateSpeeding,
  evaluateLowFuel,
  evaluateRouteDeviation,
  evaluateGpsOffline,
  evaluateDelay,
  evaluateMaintenanceDue,
  evaluateRealtimeRules,
  type AlertThresholds,
} from "@/lib/telemetry/alert-rules";

const thresholds: AlertThresholds = {
  speedLimitKmh: 90,
  lowFuelThresholdPct: 20,
  routeDeviationToleranceMeters: 1000,
  delayToleranceMinutes: 15,
  gpsOfflineMinutes: 10,
};

describe("evaluateSpeeding", () => {
  it("no genera alerta dentro del límite", () => {
    const sample = { position: { latitude: 19, longitude: -99 }, speedKmh: 80, fuelPct: 50, recordedAt: new Date() };
    expect(evaluateSpeeding(sample, thresholds)).toBeNull();
  });

  it("genera alerta warning al exceder ligeramente el límite", () => {
    const sample = { position: { latitude: 19, longitude: -99 }, speedKmh: 100, fuelPct: 50, recordedAt: new Date() };
    const alert = evaluateSpeeding(sample, thresholds);
    expect(alert?.type).toBe("speeding");
    expect(alert?.severity).toBe("warning");
  });

  it("genera alerta critical con exceso mayor a 20 km/h", () => {
    const sample = { position: { latitude: 19, longitude: -99 }, speedKmh: 120, fuelPct: 50, recordedAt: new Date() };
    const alert = evaluateSpeeding(sample, thresholds);
    expect(alert?.severity).toBe("critical");
  });

  it("ignora velocidad nula", () => {
    const sample = { position: { latitude: 19, longitude: -99 }, speedKmh: null, fuelPct: 50, recordedAt: new Date() };
    expect(evaluateSpeeding(sample, thresholds)).toBeNull();
  });

  it("no alerta justo en el límite", () => {
    const sample = { position: { latitude: 19, longitude: -99 }, speedKmh: 90, fuelPct: 50, recordedAt: new Date() };
    expect(evaluateSpeeding(sample, thresholds)).toBeNull();
  });
});

describe("evaluateLowFuel", () => {
  it("no genera alerta con combustible suficiente", () => {
    const sample = { position: { latitude: 19, longitude: -99 }, speedKmh: 60, fuelPct: 50, recordedAt: new Date() };
    expect(evaluateLowFuel(sample, thresholds)).toBeNull();
  });

  it("genera alerta warning en el umbral", () => {
    const sample = { position: { latitude: 19, longitude: -99 }, speedKmh: 60, fuelPct: 20, recordedAt: new Date() };
    const alert = evaluateLowFuel(sample, thresholds);
    expect(alert?.type).toBe("low_fuel");
    expect(alert?.severity).toBe("warning");
  });

  it("genera alerta critical con combustible muy bajo", () => {
    const sample = { position: { latitude: 19, longitude: -99 }, speedKmh: 60, fuelPct: 5, recordedAt: new Date() };
    const alert = evaluateLowFuel(sample, thresholds);
    expect(alert?.severity).toBe("critical");
  });

  it("ignora combustible nulo", () => {
    const sample = { position: { latitude: 19, longitude: -99 }, speedKmh: 60, fuelPct: null, recordedAt: new Date() };
    expect(evaluateLowFuel(sample, thresholds)).toBeNull();
  });
});

describe("evaluateRouteDeviation", () => {
  const path = [
    { latitude: 19.0, longitude: -99.0 },
    { latitude: 19.0, longitude: -98.0 },
  ];

  it("no alerta si está sobre la ruta", () => {
    const sample = { position: { latitude: 19.0, longitude: -98.5 }, speedKmh: 60, fuelPct: 50, recordedAt: new Date() };
    expect(evaluateRouteDeviation(sample, path, thresholds)).toBeNull();
  });

  it("alerta si se desvía más allá de la tolerancia", () => {
    const sample = { position: { latitude: 19.05, longitude: -98.5 }, speedKmh: 60, fuelPct: 50, recordedAt: new Date() };
    const alert = evaluateRouteDeviation(sample, path, thresholds);
    expect(alert?.type).toBe("route_deviation");
  });

  it("ignora rutas con menos de 2 puntos", () => {
    const sample = { position: { latitude: 25, longitude: -98.5 }, speedKmh: 60, fuelPct: 50, recordedAt: new Date() };
    expect(evaluateRouteDeviation(sample, [path[0]!], thresholds)).toBeNull();
  });
});

describe("evaluateGpsOffline", () => {
  it("no alerta si la última ubicación es reciente", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const last = new Date("2026-01-01T11:55:00Z");
    expect(evaluateGpsOffline(last, now, thresholds)).toBeNull();
  });

  it("alerta si supera los minutos configurados", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const last = new Date("2026-01-01T11:45:00Z");
    const alert = evaluateGpsOffline(last, now, thresholds);
    expect(alert?.type).toBe("gps_offline");
  });

  it("ignora si no hay ubicación previa", () => {
    expect(evaluateGpsOffline(null, new Date(), thresholds)).toBeNull();
  });
});

describe("evaluateDelay", () => {
  it("no alerta si no hay hora programada", () => {
    expect(evaluateDelay({ scheduledEndAt: null, progressPct: 50, now: new Date() }, thresholds)).toBeNull();
  });

  it("no alerta si ya completó (progressPct 100)", () => {
    const ctx = { scheduledEndAt: new Date("2026-01-01T10:00:00Z"), progressPct: 100, now: new Date("2026-01-01T11:00:00Z") };
    expect(evaluateDelay(ctx, thresholds)).toBeNull();
  });

  it("alerta si supera la tolerancia de retraso", () => {
    const ctx = { scheduledEndAt: new Date("2026-01-01T10:00:00Z"), progressPct: 80, now: new Date("2026-01-01T10:20:00Z") };
    const alert = evaluateDelay(ctx, thresholds);
    expect(alert?.type).toBe("delay");
  });

  it("severidad critical con más de 60 min de retraso", () => {
    const ctx = { scheduledEndAt: new Date("2026-01-01T10:00:00Z"), progressPct: 80, now: new Date("2026-01-01T11:10:00Z") };
    const alert = evaluateDelay(ctx, thresholds);
    expect(alert?.severity).toBe("critical");
  });
});

describe("evaluateMaintenanceDue", () => {
  it("no alerta si falta mucho para el servicio", () => {
    const result = evaluateMaintenanceDue({
      odometerKm: 10000,
      nextServiceOdometer: 20000,
      nextServiceDate: null,
      now: new Date(),
    });
    expect(result).toBeNull();
  });

  it("alerta warning cuando se acerca por kilometraje", () => {
    const result = evaluateMaintenanceDue({
      odometerKm: 19500,
      nextServiceOdometer: 20000,
      nextServiceDate: null,
      now: new Date(),
    });
    expect(result?.severity).toBe("warning");
  });

  it("alerta critical cuando el servicio está vencido por kilometraje", () => {
    const result = evaluateMaintenanceDue({
      odometerKm: 20500,
      nextServiceOdometer: 20000,
      nextServiceDate: null,
      now: new Date(),
    });
    expect(result?.severity).toBe("critical");
  });

  it("evalúa vencimiento por fecha", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const result = evaluateMaintenanceDue({
      odometerKm: 1000,
      nextServiceOdometer: null,
      nextServiceDate: new Date("2025-12-30T00:00:00Z"),
      now,
    });
    expect(result?.severity).toBe("critical");
  });
});

describe("evaluateRealtimeRules", () => {
  it("combina múltiples reglas en una sola llamada", () => {
    const sample = {
      position: { latitude: 19.0, longitude: -98.5 },
      speedKmh: 110,
      fuelPct: 10,
      recordedAt: new Date(),
    };
    const results = evaluateRealtimeRules(sample, thresholds, []);
    const types = results.map((r) => r.type);
    expect(types).toContain("speeding");
    expect(types).toContain("low_fuel");
  });

  it("no genera alertas cuando todo está en rango", () => {
    const sample = { position: { latitude: 19, longitude: -99 }, speedKmh: 60, fuelPct: 80, recordedAt: new Date() };
    expect(evaluateRealtimeRules(sample, thresholds, [])).toHaveLength(0);
  });
});
