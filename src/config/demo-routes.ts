import type { GeoPoint } from "@/types/domain";

/**
 * Rutas demo alrededor del centro de México para el simulador visual.
 * Coordenadas aproximadas (lat, lng) de puntos reales.
 */
export interface DemoRoute {
  unitNumber: string;
  name: string;
  path: GeoPoint[];
}

export const CDMX: GeoPoint = { latitude: 19.4326, longitude: -99.1332 };

export const DEMO_ROUTES: DemoRoute[] = [
  {
    unitNumber: "TRK-001",
    name: "CDMX → Pachuca",
    path: [
      { latitude: 19.4326, longitude: -99.1332 },
      { latitude: 19.6, longitude: -99.05 },
      { latitude: 19.85, longitude: -98.95 },
      { latitude: 20.1011, longitude: -98.7591 },
    ],
  },
  {
    unitNumber: "TRK-002",
    name: "Pachuca → Tula",
    path: [
      { latitude: 20.1011, longitude: -98.7591 },
      { latitude: 20.05, longitude: -99.0 },
      { latitude: 20.0574, longitude: -99.3436 },
    ],
  },
  {
    unitNumber: "TRK-003",
    name: "CDMX → Puebla",
    path: [
      { latitude: 19.4326, longitude: -99.1332 },
      { latitude: 19.3, longitude: -98.8 },
      { latitude: 19.15, longitude: -98.4 },
      { latitude: 19.0414, longitude: -98.2063 },
    ],
  },
  {
    unitNumber: "TRK-004",
    name: "Querétaro → CDMX",
    path: [
      { latitude: 20.5888, longitude: -100.3899 },
      { latitude: 20.2, longitude: -99.9 },
      { latitude: 19.8, longitude: -99.4 },
      { latitude: 19.4326, longitude: -99.1332 },
    ],
  },
  {
    unitNumber: "TRK-005",
    name: "Toluca → CDMX",
    path: [
      { latitude: 19.2826, longitude: -99.6557 },
      { latitude: 19.35, longitude: -99.4 },
      { latitude: 19.4326, longitude: -99.1332 },
    ],
  },
];
