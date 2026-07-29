"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, LayersControl, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { TruckStatus } from "@/types/domain";
import { SmoothAnimatedMarker, type AnimatedUnit } from "./smooth-animated-marker";
import "leaflet/dist/leaflet.css";

export interface MapUnit extends AnimatedUnit {}

export interface MapRoutePath {
  id: string;
  points: [number, number][];
  originName?: string;
  destinationName?: string;
}

function startPinIcon(): L.DivIcon {
  return L.divIcon({
    className: "route-start-pin",
    html: `
      <div style="background:#22C55E; color:#0F172A; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:11px; border:2px solid #FFFFFF; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">
        A
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function endPinIcon(): L.DivIcon {
  return L.divIcon({
    className: "route-end-pin",
    html: `
      <div style="background:#EF4444; color:#FFFFFF; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:11px; border:2px solid #FFFFFF; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">
        B
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function FitBounds({ units, selectedUnitId }: { units: MapUnit[]; selectedUnitId?: string | null }) {
  const map = useMap();
  const done = useRef(false);

  useEffect(() => {
    if (selectedUnitId) {
      const selected = units.find((u) => u.id === selectedUnitId);
      if (selected) {
        map.flyTo([selected.latitude, selected.longitude], 15, { duration: 1.2 });
        return;
      }
    }

    if (done.current || units.length === 0) return;

    const bounds = L.latLngBounds(units.map((u) => [u.latitude, u.longitude] as [number, number]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      done.current = true;
    }
  }, [units, selectedUnitId, map]);

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
    <div className="relative h-full w-full overflow-hidden rounded-[var(--radius)]">
      <MapContainer
        center={center}
        zoom={12}
        className="h-full w-full z-0"
        scrollWheelZoom
        preferCanvas
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="🌙 Modo Oscuro HD (Uber Style)">
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png"
              maxZoom={20}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🛰️ Satelital HD (Esri)">
            <TileLayer
              attribution="Esri, Maxar, Earthstar Geographics"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🗺️ Calles Claras HD">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <FitBounds units={units} selectedUnitId={selectedUnitId} />

        {/* Trazado de rutas con halo brillante estilo Neón/Uber */}
        {routes.map((r) => {
          if (!r.points || r.points.length < 2) return null;
          const startPt = r.points[0]!;
          const endPt = r.points[r.points.length - 1]!;

          return (
            <div key={r.id}>
              {/* Sombra / Glow exterior */}
              <Polyline
                positions={r.points}
                pathOptions={{
                  color: "#00E5FF",
                  weight: 8,
                  opacity: 0.35,
                  lineCap: "round",
                }}
              />
              {/* Línea principal vibrante */}
              <Polyline
                positions={r.points}
                pathOptions={{
                  color: "#00B0FF",
                  weight: 4,
                  opacity: 0.9,
                  dashArray: "8 4",
                }}
              />
              {/* Marcador de Origen */}
              <Marker position={startPt} icon={startPinIcon()}>
                <Popup>
                  <div className="text-xs">
                    <span className="font-bold text-emerald-500">Punto A (Origen)</span>
                    <p>{r.originName ?? "Origen de la ruta"}</p>
                  </div>
                </Popup>
              </Marker>
              {/* Marcador de Destino */}
              <Marker position={endPt} icon={endPinIcon()}>
                <Popup>
                  <div className="text-xs">
                    <span className="font-bold text-rose-500">Punto B (Destino)</span>
                    <p>{r.destinationName ?? "Destino de la ruta"}</p>
                  </div>
                </Popup>
              </Marker>
            </div>
          );
        })}

        {/* Marcadores de camiones animados en tiempo real */}
        {units.map((unit) => (
          <SmoothAnimatedMarker
            key={unit.id}
            unit={unit}
            selectedUnitId={selectedUnitId}
            onSelectUnit={onSelectUnit}
          />
        ))}
      </MapContainer>

      {/* Estilos CSS inyectados para efectos de pulso Uber y popups ultra profesionales */}
      <style jsx global>{`
        @keyframes uberPulse {
          0% {
            transform: scale(0.8);
            opacity: 0.9;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
        .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95) !important;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: 12px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6);
          color: #f8fafc !important;
        }
        .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid rgba(56, 189, 248, 0.3);
        }
        .uber-truck-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
