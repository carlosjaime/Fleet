"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import type { TruckStatus } from "@/types/domain";
import { formatCoordinate, formatSpeed, formatPercent } from "@/lib/utils/format";
import "leaflet/dist/leaflet.css";

export interface MapUnit {
  id: string;
  name: string;
  unitNumber: string;
  latitude: number;
  longitude: number;
  heading: number;
  speedKmh: number;
  fuelPct: number;
  status: TruckStatus;
  simulated?: boolean;
}

export interface MapRoutePath {
  id: string;
  points: [number, number][];
}

const STATUS_COLOR: Record<TruckStatus, string> = {
  active: "#22C55E",
  idle: "#9299A6",
  offline: "#EF4444",
  maintenance: "#FFB020",
};

function truckIcon(unit: MapUnit): L.DivIcon {
  const color = STATUS_COLOR[unit.status];
  return L.divIcon({
    className: "fleet-marker",
    html: `<div style="transform: rotate(${unit.heading}deg); width:26px; height:26px; display:flex; align-items:center; justify-content:center;">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,.6))">
        <path d="M12 2 L19 20 L12 16 L5 20 Z" fill="${color}" stroke="#090A0F" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>
    </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function FitBounds({ units }: { units: MapUnit[] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || units.length === 0) return;
    const bounds = L.latLngBounds(units.map((u) => [u.latitude, u.longitude] as [number, number]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 11 });
      done.current = true;
    }
  }, [units, map]);
  return null;
}

export default function FleetMap({
  units,
  routes = [],
  selectedUnitId,
  onSelectUnit,
}: {
  units: MapUnit[];
  routes?: MapRoutePath[];
  selectedUnitId?: string | null;
  onSelectUnit?: (id: string) => void;
}) {
  const center = useMemo<[number, number]>(() => {
    if (units.length > 0) return [units[0]!.latitude, units[0]!.longitude];
    return [19.4326, -99.1332]; // CDMX
  }, [units]);

  return (
    <MapContainer
      center={center}
      zoom={6}
      className="h-full w-full"
      scrollWheelZoom
      preferCanvas
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <FitBounds units={units} />

      {routes.map((r) => (
        <Polyline
          key={r.id}
          positions={r.points}
          pathOptions={{ color: "#00D9F5", weight: 3, opacity: 0.7, dashArray: "6 6" }}
        />
      ))}

      {units.map((unit) => (
        <Marker
          key={unit.id}
          position={[unit.latitude, unit.longitude]}
          icon={truckIcon(unit)}
          eventHandlers={{ click: () => onSelectUnit?.(unit.id) }}
          opacity={selectedUnitId && selectedUnitId !== unit.id ? 0.6 : 1}
        >
          <Popup>
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-[13px]">
                {unit.unitNumber} · {unit.name}
                {unit.simulated ? " (sim)" : ""}
              </p>
              <p className="telemetry">{formatCoordinate(unit.latitude, unit.longitude)}</p>
              <p>Velocidad: {formatSpeed(unit.speedKmh)}</p>
              <p>Combustible: {formatPercent(unit.fuelPct)}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
