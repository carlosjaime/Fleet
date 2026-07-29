"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Radio, Navigation, AlertCircle, CheckCircle2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendLiveLocation } from "@/features/fleet/actions";
import { formatCoordinate, formatSpeed } from "@/lib/utils/format";

export interface DeviceGpsTrackerProps {
  trucks: { id: string; unit_number: string; name: string }[];
}

export function DeviceGpsTracker({ trucks }: DeviceGpsTrackerProps) {
  const [selectedTruckId, setSelectedTruckId] = useState<string>(trucks[0]?.id ?? "");
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [lastCoords, setLastCoords] = useState<{
    lat: number;
    lng: number;
    speed: number;
    heading: number;
    accuracy: number;
    timestamp: string;
  } | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta la API de Geolocalización GPS.");
      return;
    }

    if (!selectedTruckId) {
      toast.error("Selecciona una unidad para asignar el tracking GPS.");
      return;
    }

    setIsTracking(true);
    toast.success("Transmisión GPS iniciada desde este dispositivo.");

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, speed, heading, accuracy } = pos.coords;
        const speedKmh = speed ? speed * 3.6 : 0;
        const currentHeading = heading || 0;
        const now = Date.now();

        setLastCoords({
          lat: latitude,
          lng: longitude,
          speed: speedKmh,
          heading: currentHeading,
          accuracy: accuracy || 0,
          timestamp: new Date().toLocaleTimeString(),
        });

        // Throttle para enviar al servidor máximo cada 3 segundos
        if (now - lastSentRef.current >= 3000) {
          lastSentRef.current = now;
          await sendLiveLocation({
            truckId: selectedTruckId,
            latitude,
            longitude,
            speedKmh,
            heading: currentHeading,
          });
        }
      },
      (err) => {
        console.error("GPS Watch error", err);
        toast.error(`Error GPS (${err.code}): ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    toast.info("Transmisión GPS detenida.");
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div className="rounded-[var(--radius)] border border-cyan/30 bg-slate-900/95 p-4 text-slate-100 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Radio className={`h-5 w-5 ${isTracking ? "animate-pulse text-cyan-400" : "text-slate-400"}`} />
          <h3 className="font-semibold text-sm">Transmisor GPS Móvil (Android / iOS / Web)</h3>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
            isTracking ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
          }`}
        >
          {isTracking ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
          {isTracking ? "TRANSMITIENDO EN VIVO" : "INACTIVO"}
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 items-center">
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Unidad asignada</label>
          <select
            value={selectedTruckId}
            onChange={(e) => setSelectedTruckId(e.target.value)}
            disabled={isTracking}
            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
          >
            {trucks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.unit_number} - {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2 pt-4 sm:pt-0">
          {!isTracking ? (
            <Button
              onClick={startTracking}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 py-2"
            >
              <Navigation className="h-4 w-4" />
              Iniciar GPS de este Dispositivo
            </Button>
          ) : (
            <Button
              onClick={stopTracking}
              variant="destructive"
              className="w-full font-medium text-xs flex items-center justify-center gap-1.5 py-2"
            >
              <Square className="h-4 w-4 fill-current" />
              Detener Transmisión
            </Button>
          )}
        </div>
      </div>

      {lastCoords ? (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-800/50 p-2 rounded">
            <span className="text-[10px] text-slate-400 block">Coordenadas</span>
            <span className="font-mono text-cyan-300">{formatCoordinate(lastCoords.lat, lastCoords.lng)}</span>
          </div>
          <div className="bg-slate-800/50 p-2 rounded">
            <span className="text-[10px] text-slate-400 block">Velocidad</span>
            <span className="font-mono text-emerald-400">{formatSpeed(lastCoords.speed)}</span>
          </div>
          <div className="bg-slate-800/50 p-2 rounded">
            <span className="text-[10px] text-slate-400 block">Precisión GPS</span>
            <span className="font-mono text-amber-300">±{Math.round(lastCoords.accuracy)}m</span>
          </div>
          <div className="bg-slate-800/50 p-2 rounded">
            <span className="text-[10px] text-slate-400 block">Último paquete</span>
            <span className="font-mono text-slate-300">{lastCoords.timestamp}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
