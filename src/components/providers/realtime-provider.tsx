"use client";

/**
 * Provee el estado de conexión Realtime a la interfaz.
 * Abre un canal ligero para reflejar el estado del socket y expone la marca
 * de la última actualización recibida por cualquier hook de la app.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/config/env";

export type RealtimeStatus = "connecting" | "connected" | "disconnected";

interface RealtimeContextValue {
  status: RealtimeStatus;
  lastUpdateAt: Date | null;
  markUpdate: () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<RealtimeStatus>(() =>
    isSupabaseConfigured() ? "connecting" : "disconnected",
  );
  const [lastUpdateAt, setLastUpdateAt] = useState<Date | null>(null);
  const mounted = useRef(true);

  const markUpdate = useCallback(() => {
    setLastUpdateAt(new Date());
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (!isSupabaseConfigured()) {
      return;
    }
    const supabase = createClient();
    const channel = supabase
      .channel("fleetops:heartbeat")
      .subscribe((state) => {
        if (!mounted.current) return;
        if (state === "SUBSCRIBED") setStatus("connected");
        else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT" || state === "CLOSED") {
          setStatus("disconnected");
        } else setStatus("connecting");
      });

    return () => {
      mounted.current = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ status, lastUpdateAt, markUpdate }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeStatus(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error("useRealtimeStatus debe usarse dentro de RealtimeProvider");
  return ctx;
}
