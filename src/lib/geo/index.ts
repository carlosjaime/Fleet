/**
 * Utilidades geográficas puras y probadas.
 * Sin dependencias externas para poder ejecutarse en cualquier runtime.
 */
import type { GeoPoint } from "@/types/domain";

export const EARTH_RADIUS_METERS = 6_371_000;

const toRadians = (deg: number): number => (deg * Math.PI) / 180;
const toDegrees = (rad: number): number => (rad * 180) / Math.PI;

/** Valida una latitud en rango [-90, 90]. */
export function isValidLatitude(lat: number): boolean {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

/** Valida una longitud en rango [-180, 180]. */
export function isValidLongitude(lng: number): boolean {
  return Number.isFinite(lng) && lng >= -180 && lng <= 180;
}

export function isValidCoordinate(point: GeoPoint): boolean {
  return isValidLatitude(point.latitude) && isValidLongitude(point.longitude);
}

/** Normaliza grados a rango [0, 360). Útil para rumbo (heading). */
export function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Distancia entre dos coordenadas usando la fórmula de Haversine.
 * @returns metros.
 */
export function haversineDistance(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Distancia en kilómetros. */
export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
  return haversineDistance(a, b) / 1000;
}

/**
 * Rumbo inicial (bearing) desde `a` hacia `b`, en grados [0, 360).
 */
export function bearing(a: GeoPoint, b: GeoPoint): number {
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return normalizeDegrees(toDegrees(Math.atan2(y, x)));
}

/**
 * Interpolación lineal entre dos coordenadas.
 * @param t fracción entre 0 (a) y 1 (b). Se acota a [0, 1].
 */
export function interpolate(a: GeoPoint, b: GeoPoint, t: number): GeoPoint {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * clamped,
    longitude: a.longitude + (b.longitude - a.longitude) * clamped,
  };
}

/**
 * Distancia aproximada (metros) entre un punto `p` y el segmento `a`-`b`.
 * Proyecta en un plano local equirectangular; suficiente para tolerancias
 * de desviación de ruta en distancias cortas.
 */
export function distanceToSegment(p: GeoPoint, a: GeoPoint, b: GeoPoint): number {
  const latRef = toRadians((a.latitude + b.latitude) / 2);
  const mPerDegLat = 111_320;
  const mPerDegLng = 111_320 * Math.cos(latRef);

  const ax = a.longitude * mPerDegLng;
  const ay = a.latitude * mPerDegLat;
  const bx = b.longitude * mPerDegLng;
  const by = b.latitude * mPerDegLat;
  const px = p.longitude * mPerDegLng;
  const py = p.latitude * mPerDegLat;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    // Segmento degenerado: distancia al punto.
    return Math.hypot(px - ax, py - ay);
  }

  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  return Math.hypot(px - projX, py - projY);
}

/**
 * Distancia mínima (metros) de un punto a una polilínea (lista de puntos).
 * Devuelve Infinity si la ruta tiene menos de un punto.
 */
export function distanceToPath(p: GeoPoint, path: readonly GeoPoint[]): number {
  if (path.length === 0) return Number.POSITIVE_INFINITY;
  if (path.length === 1) return haversineDistance(p, path[0]!);

  let min = Number.POSITIVE_INFINITY;
  for (let i = 0; i < path.length - 1; i++) {
    const d = distanceToSegment(p, path[i]!, path[i + 1]!);
    if (d < min) min = d;
  }
  return min;
}

/**
 * Progreso aproximado [0, 1] a lo largo de una ruta origen→destino según la
 * proyección de la posición actual sobre el segmento directo.
 */
export function approximateProgress(
  position: GeoPoint,
  origin: GeoPoint,
  destination: GeoPoint,
): number {
  const total = haversineDistance(origin, destination);
  if (total === 0) return 1;
  const traveled = haversineDistance(origin, position);
  return Math.max(0, Math.min(1, traveled / total));
}
