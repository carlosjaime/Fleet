import { describe, it, expect } from "vitest";
import {
  haversineDistance,
  haversineDistanceKm,
  isValidLatitude,
  isValidLongitude,
  isValidCoordinate,
  normalizeDegrees,
  bearing,
  interpolate,
  distanceToSegment,
  distanceToPath,
  approximateProgress,
} from "@/lib/geo";

describe("haversineDistance", () => {
  it("devuelve 0 para el mismo punto", () => {
    const p = { latitude: 19.4326, longitude: -99.1332 };
    expect(haversineDistance(p, p)).toBeCloseTo(0, 5);
  });

  it("calcula la distancia aproximada CDMX-Pachuca (~90 km)", () => {
    const cdmx = { latitude: 19.4326, longitude: -99.1332 };
    const pachuca = { latitude: 20.1011, longitude: -98.7591 };
    const km = haversineDistanceKm(cdmx, pachuca);
    expect(km).toBeGreaterThan(75);
    expect(km).toBeLessThan(105);
  });

  it("es simétrica", () => {
    const a = { latitude: 19.0, longitude: -99.0 };
    const b = { latitude: 20.0, longitude: -98.0 };
    expect(haversineDistance(a, b)).toBeCloseTo(haversineDistance(b, a), 6);
  });
});

describe("isValidLatitude / isValidLongitude", () => {
  it("acepta límites válidos", () => {
    expect(isValidLatitude(90)).toBe(true);
    expect(isValidLatitude(-90)).toBe(true);
    expect(isValidLongitude(180)).toBe(true);
    expect(isValidLongitude(-180)).toBe(true);
  });

  it("rechaza valores fuera de rango", () => {
    expect(isValidLatitude(90.1)).toBe(false);
    expect(isValidLatitude(-91)).toBe(false);
    expect(isValidLongitude(180.1)).toBe(false);
    expect(isValidLongitude(-200)).toBe(false);
  });

  it("rechaza NaN e Infinity", () => {
    expect(isValidLatitude(NaN)).toBe(false);
    expect(isValidLatitude(Infinity)).toBe(false);
  });

  it("isValidCoordinate combina ambas validaciones", () => {
    expect(isValidCoordinate({ latitude: 19, longitude: -99 })).toBe(true);
    expect(isValidCoordinate({ latitude: 91, longitude: -99 })).toBe(false);
    expect(isValidCoordinate({ latitude: 19, longitude: 200 })).toBe(false);
  });
});

describe("normalizeDegrees", () => {
  it("mantiene valores dentro de rango", () => {
    expect(normalizeDegrees(45)).toBe(45);
    expect(normalizeDegrees(0)).toBe(0);
  });
  it("normaliza valores negativos", () => {
    expect(normalizeDegrees(-10)).toBe(350);
    expect(normalizeDegrees(-360)).toBe(0);
  });
  it("normaliza valores mayores a 360", () => {
    expect(normalizeDegrees(370)).toBe(10);
    expect(normalizeDegrees(720)).toBe(0);
  });
});

describe("bearing", () => {
  it("apunta al norte (0°) cuando el destino está directamente arriba", () => {
    const a = { latitude: 19.0, longitude: -99.0 };
    const b = { latitude: 20.0, longitude: -99.0 };
    expect(bearing(a, b)).toBeCloseTo(0, 0);
  });
  it("apunta al este (90°) cuando el destino está directamente a la derecha", () => {
    const a = { latitude: 19.0, longitude: -99.0 };
    const b = { latitude: 19.0, longitude: -98.0 };
    expect(bearing(a, b)).toBeCloseTo(90, 0);
  });
});

describe("interpolate", () => {
  const a = { latitude: 19.0, longitude: -99.0 };
  const b = { latitude: 20.0, longitude: -98.0 };

  it("t=0 devuelve el punto de origen", () => {
    expect(interpolate(a, b, 0)).toEqual(a);
  });
  it("t=1 devuelve el punto de destino", () => {
    expect(interpolate(a, b, 1)).toEqual(b);
  });
  it("t=0.5 devuelve el punto medio", () => {
    const mid = interpolate(a, b, 0.5);
    expect(mid.latitude).toBeCloseTo(19.5, 5);
    expect(mid.longitude).toBeCloseTo(-98.5, 5);
  });
  it("acota t fuera de [0,1]", () => {
    expect(interpolate(a, b, -1)).toEqual(a);
    expect(interpolate(a, b, 2)).toEqual(b);
  });
});

describe("distanceToSegment", () => {
  it("es 0 cuando el punto está sobre el segmento", () => {
    const a = { latitude: 19.0, longitude: -99.0 };
    const b = { latitude: 19.0, longitude: -98.0 };
    const p = { latitude: 19.0, longitude: -98.5 };
    expect(distanceToSegment(p, a, b)).toBeLessThan(5);
  });

  it("mide la distancia perpendicular a un segmento", () => {
    const a = { latitude: 19.0, longitude: -99.0 };
    const b = { latitude: 19.0, longitude: -98.0 };
    const p = { latitude: 19.01, longitude: -98.5 }; // ~1.1km al norte
    const d = distanceToSegment(p, a, b);
    expect(d).toBeGreaterThan(900);
    expect(d).toBeLessThan(1300);
  });

  it("maneja segmentos degenerados (a === b)", () => {
    const a = { latitude: 19.0, longitude: -99.0 };
    const p = { latitude: 19.01, longitude: -99.0 };
    expect(distanceToSegment(p, a, a)).toBeGreaterThan(0);
  });
});

describe("distanceToPath", () => {
  it("devuelve Infinity para rutas vacías", () => {
    expect(distanceToPath({ latitude: 19, longitude: -99 }, [])).toBe(Infinity);
  });

  it("encuentra el segmento más cercano en una polilínea", () => {
    const path = [
      { latitude: 19.0, longitude: -99.0 },
      { latitude: 19.0, longitude: -98.5 },
      { latitude: 19.5, longitude: -98.5 },
    ];
    const onPath = { latitude: 19.0, longitude: -98.7 };
    expect(distanceToPath(onPath, path)).toBeLessThan(50);
  });
});

describe("approximateProgress", () => {
  const origin = { latitude: 19.0, longitude: -99.0 };
  const destination = { latitude: 20.0, longitude: -99.0 };

  it("es 0 en el origen", () => {
    expect(approximateProgress(origin, origin, destination)).toBeCloseTo(0, 2);
  });
  it("es 1 en el destino", () => {
    expect(approximateProgress(destination, origin, destination)).toBeCloseTo(1, 2);
  });
  it("es ~0.5 en el punto medio", () => {
    const mid = { latitude: 19.5, longitude: -99.0 };
    expect(approximateProgress(mid, origin, destination)).toBeCloseTo(0.5, 1);
  });
  it("se acota a 1 si se pasa del destino", () => {
    const beyond = { latitude: 21.0, longitude: -99.0 };
    expect(approximateProgress(beyond, origin, destination)).toBe(1);
  });
});
