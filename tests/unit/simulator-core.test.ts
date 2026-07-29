import { describe, it, expect } from "vitest";
import { advanceUnit, pathLengthKm, type SimUnit } from "@/lib/telemetry/simulator-core";

function makeUnit(overrides: Partial<SimUnit> = {}): SimUnit {
  return {
    id: "1",
    name: "Test",
    unitNumber: "TRK-001",
    path: [
      { latitude: 19.0, longitude: -99.0 },
      { latitude: 19.5, longitude: -99.0 },
      { latitude: 20.0, longitude: -99.0 },
    ],
    segment: 0,
    segmentT: 0,
    position: { latitude: 19.0, longitude: -99.0 },
    heading: 0,
    speedKmh: 60,
    fuelPct: 80,
    odometerKm: 1000,
    ...overrides,
  };
}

describe("pathLengthKm", () => {
  it("suma la distancia entre puntos consecutivos", () => {
    const path = [
      { latitude: 19.0, longitude: -99.0 },
      { latitude: 19.5, longitude: -99.0 },
    ];
    expect(pathLengthKm(path)).toBeGreaterThan(50);
  });
});

describe("advanceUnit", () => {
  it("no cambia posición con rutas de menos de 2 puntos", () => {
    const unit = makeUnit({ path: [{ latitude: 19.0, longitude: -99.0 }] });
    const result = advanceUnit(unit, 10);
    expect(result).toEqual(unit);
  });

  it("avanza la posición del camión con el tiempo", () => {
    const unit = makeUnit();
    const result = advanceUnit(unit, 60);
    expect(result.position).not.toEqual(unit.position);
    expect(result.odometerKm).toBeGreaterThan(unit.odometerKm);
  });

  it("consume combustible al avanzar", () => {
    const unit = makeUnit();
    const result = advanceUnit(unit, 120);
    expect(result.fuelPct).toBeLessThanOrEqual(unit.fuelPct);
  });

  it("reinicia el ciclo al llegar al final de la ruta", () => {
    const unit = makeUnit({ segment: 1, segmentT: 0.99 });
    // Avance grande para forzar pasar el final del segundo (y último) segmento.
    const result = advanceUnit(unit, 3600);
    expect(result.segment).toBe(0);
    expect(result.segmentT).toBe(0);
  });

  it("mantiene la velocidad dentro de límites razonables", () => {
    const unit = makeUnit({ speedKmh: 60 });
    const result = advanceUnit(unit, 1);
    expect(result.speedKmh).toBeGreaterThanOrEqual(20);
    expect(result.speedKmh).toBeLessThanOrEqual(110);
  });

  it("no muta el objeto original (inmutabilidad)", () => {
    const unit = makeUnit();
    const snapshot = JSON.parse(JSON.stringify(unit));
    advanceUnit(unit, 60);
    expect(unit).toEqual(snapshot);
  });
});
