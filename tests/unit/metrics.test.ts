import { describe, it, expect } from "vitest";
import {
  fuelEfficiencyKmPerLiter,
  costPerKm,
  fuelTotalCost,
  average,
  fleetUtilizationPct,
  isAbnormalConsumption,
} from "@/lib/utils/metrics";

describe("fuelEfficiencyKmPerLiter", () => {
  it("calcula km/L correctamente", () => {
    expect(fuelEfficiencyKmPerLiter(300, 100)).toBe(3);
  });
  it("devuelve null si los litros son 0 o negativos", () => {
    expect(fuelEfficiencyKmPerLiter(300, 0)).toBeNull();
    expect(fuelEfficiencyKmPerLiter(300, -5)).toBeNull();
  });
  it("devuelve null si la distancia es negativa", () => {
    expect(fuelEfficiencyKmPerLiter(-10, 100)).toBeNull();
  });
});

describe("costPerKm", () => {
  it("calcula el costo por kilómetro", () => {
    expect(costPerKm(1000, 200)).toBe(5);
  });
  it("devuelve null si la distancia es 0", () => {
    expect(costPerKm(1000, 0)).toBeNull();
  });
});

describe("fuelTotalCost", () => {
  it("multiplica litros por precio y redondea a centavos", () => {
    expect(fuelTotalCost(50, 24.5)).toBe(1225);
    expect(fuelTotalCost(33.333, 23.99)).toBeCloseTo(799.66, 1);
  });
});

describe("average", () => {
  it("calcula el promedio ignorando nulos", () => {
    expect(average([10, 20, null, 30, undefined])).toBe(20);
  });
  it("devuelve 0 para un arreglo vacío o todo nulo", () => {
    expect(average([])).toBe(0);
    expect(average([null, undefined])).toBe(0);
  });
});

describe("fleetUtilizationPct", () => {
  it("calcula el porcentaje de utilización", () => {
    expect(fleetUtilizationPct(4, 8)).toBe(50);
  });
  it("devuelve 0 si no hay unidades", () => {
    expect(fleetUtilizationPct(0, 0)).toBe(0);
  });
});

describe("isAbnormalConsumption", () => {
  it("marca como atípico un rendimiento muy por debajo de la media", () => {
    expect(isAbnormalConsumption(2, 5)).toBe(true);
  });
  it("no marca como atípico un rendimiento cercano a la media", () => {
    expect(isAbnormalConsumption(4.8, 5)).toBe(false);
  });
  it("devuelve false si la media de la flota es 0", () => {
    expect(isAbnormalConsumption(3, 0)).toBe(false);
  });
});
