"use client";

import { useEffect, useRef, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { TruckStatus } from "@/types/domain";
import { formatCoordinate, formatSpeed, formatPercent } from "@/lib/utils/format";

export interface AnimatedUnit {
  id: string;
  name: string;
  unitNumber: string;
  latitude: number;
  longitude: number;
  heading: number;
  speedKmh: number;
  fuelPct: number;
  status: TruckStatus;
  driverName?: string | null;
  simulated?: boolean;
}

const STATUS_COLOR: Record<TruckStatus, string> = {
  active: "#22C55E",
  idle: "#9299A6",
  offline: "#EF4444",
  maintenance: "#FFB020",
};

const STATUS_LABEL: Record<TruckStatus, string> = {
  active: "En Ruta",
  idle: "Ralentí",
  offline: "Desconectado",
  maintenance: "Mantenimiento",
};

function createUberTruckIcon(unit: AnimatedUnit, displayHeading: number): L.DivIcon {
  const color = STATUS_COLOR[unit.status] ?? "#22C55E";
  const speedText = Math.round(unit.speedKmh ?? 0);

  return L.divIcon({
    className: "uber-truck-marker",
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; pointer-events: auto;">
        ${
          unit.status === "active"
            ? `<div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: ${color}22; border: 1.5px solid ${color}66; animation: uberPulse 2s infinite ease-out;"></div>`
            : ""
        }
        <div style="transform: rotate(${displayHeading}deg); transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.45));">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2 L19 21 L12 17 L5 21 Z" fill="${color}" stroke="#0F172A" stroke-width="1.8" stroke-linejoin="round"/>
            <circle cx="12" cy="11" r="2.5" fill="#0F172A"/>
          </svg>
        </div>
        <div style="position: absolute; bottom: -6px; background: rgba(15, 23, 42, 0.9); border: 1px solid ${color}; color: #F8FAFC; font-family: monospace; font-size: 9px; font-weight: 700; padding: 1px 4px; border-radius: 4px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">
          ${speedText} km/h
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}

function lerp(start: number, end: number, amt: number) {
  return (1 - amt) * start + amt * end;
}

function lerpAngle(start: number, end: number, amt: number) {
  const da = (end - start) % 360;
  const shortest = ((2 * da) % 360) - da;
  return start + shortest * amt;
}

export function SmoothAnimatedMarker({
  unit,
  selectedUnitId,
  onSelectUnit,
}: {
  unit: AnimatedUnit;
  selectedUnitId?: string | null;
  onSelectUnit?: (id: string) => void;
}) {
  const [currentPos, setCurrentPos] = useState<[number, number]>([unit.latitude, unit.longitude]);
  const [currentHeading, setCurrentHeading] = useState<number>(unit.heading);

  const prevPosRef = useRef<[number, number]>([unit.latitude, unit.longitude]);
  const targetPosRef = useRef<[number, number]>([unit.latitude, unit.longitude]);

  const prevHeadingRef = useRef<number>(unit.heading);
  const targetHeadingRef = useRef<number>(unit.heading);

  const animRef = useRef<number | null>(null);

  useEffect(() => {
    prevPosRef.current = currentPos;
    targetPosRef.current = [unit.latitude, unit.longitude];

    prevHeadingRef.current = currentHeading;
    targetHeadingRef.current = unit.heading;

    const startTime = performance.now();
    const duration = 1800; // 1.8 segundos de interpolación suave estilo Uber

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Curva de aceleración/desaceleración suave (easeOutCubic)
      const ease = 1 - Math.pow(1 - progress, 3);

      const lat = lerp(prevPosRef.current[0], targetPosRef.current[0], ease);
      const lng = lerp(prevPosRef.current[1], targetPosRef.current[1], ease);
      const hdg = lerpAngle(prevHeadingRef.current, targetHeadingRef.current, ease);

      setCurrentPos([lat, lng]);
      setCurrentHeading(hdg);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [unit.latitude, unit.longitude, unit.heading]);

  const icon = createUberTruckIcon(unit, currentHeading);

  return (
    <Marker
      position={currentPos}
      icon={icon}
      eventHandlers={{ click: () => onSelectUnit?.(unit.id) }}
      opacity={selectedUnitId && selectedUnitId !== unit.id ? 0.65 : 1}
    >
      <Popup className="uber-style-popup">
        <div className="space-y-2 p-1 text-slate-100">
          <div className="flex items-center justify-between gap-3 border-b border-slate-700 pb-1.5">
            <div>
              <p className="font-bold text-sm text-cyan-400">
                {unit.unitNumber} · {unit.name}
              </p>
              {unit.driverName ? (
                <p className="text-xs text-slate-300">Conductor: {unit.driverName}</p>
              ) : null}
            </div>
            <span
              className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: STATUS_COLOR[unit.status] }}
            >
              {STATUS_LABEL[unit.status]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">Velocidad</span>
              <span className="font-mono font-semibold text-emerald-400">
                {formatSpeed(unit.speedKmh)}
              </span>
            </div>
            <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">Combustible</span>
              <span className="font-mono font-semibold text-amber-400">
                {formatPercent(unit.fuelPct)}
              </span>
            </div>
          </div>

          <div className="pt-1 text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>Coordenadas:</span>
            <span>{formatCoordinate(currentPos[0], currentPos[1])}</span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
