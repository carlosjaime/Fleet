/**
 * Cálculos operativos de flota (puros y probados).
 */

/**
 * Rendimiento en kilómetros por litro.
 * @returns km/L o null si los datos no permiten el cálculo.
 */
export function fuelEfficiencyKmPerLiter(distanceKm: number, liters: number): number | null {
  if (liters <= 0 || distanceKm < 0) return null;
  return distanceKm / liters;
}

/**
 * Costo por kilómetro.
 * @returns MXN/km o null si la distancia no es válida.
 */
export function costPerKm(totalCost: number, distanceKm: number): number | null {
  if (distanceKm <= 0 || totalCost < 0) return null;
  return totalCost / distanceKm;
}

/** Total de una carga de combustible: litros * precio por litro. */
export function fuelTotalCost(liters: number, pricePerLiter: number): number {
  const total = liters * pricePerLiter;
  return Math.round(total * 100) / 100;
}

/** Promedio simple ignorando valores nulos. */
export function average(values: readonly (number | null | undefined)[]): number {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Utilización de flota: unidades activas / total, en porcentaje. */
export function fleetUtilizationPct(activeUnits: number, totalUnits: number): number {
  if (totalUnits <= 0) return 0;
  return Math.round((activeUnits / totalUnits) * 100);
}

/**
 * Detecta consumo atípico comparando el rendimiento de una unidad contra
 * la media de la flota. Devuelve true si el rendimiento es peor (menor)
 * que la media por un factor de desviación.
 */
export function isAbnormalConsumption(
  unitKmPerLiter: number,
  fleetKmPerLiter: number,
  deviationFactor = 0.7,
): boolean {
  if (fleetKmPerLiter <= 0) return false;
  return unitKmPerLiter < fleetKmPerLiter * deviationFactor;
}
