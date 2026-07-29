"use client";

/**
 * Suscripción Realtime a nuevas ubicaciones GPS (truck_locations) de la
 * organización activa. Sólo escucha INSERT (es una tabla de historial).
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/config/env";
import { useRealtimeStatus } from "@/components/providers/realtime-provider";
import type { TruckLocation } from "@/types/domain";
import { trucksQueryKey } from "./use-trucks-realtime";
import type { Truck } from "@/types/domain";

export const latestLocationsQueryKey = (organizationId: string) =>
  ["truck-locations", "latest", organizationId] as const;

export function useTruckLocationsRealtime(
  organizationId: string,
  onLocation?: (location: TruckLocation) => void,
) {
  const queryClient = useQueryClient();
  const { markUpdate } = useRealtimeStatus();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !organizationId) return;
    if (channelRef.current) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`org:${organizationId}:truck_locations`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "truck_locations",
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          markUpdate();
          const location = payload.new as TruckLocation;
          onLocation?.(location);

          // Refleja la última posición conocida en la caché de trucks
          // (además del propio UPDATE del trigger de trucks).
          queryClient.setQueryData<Truck[]>(trucksQueryKey(organizationId), (prev) => {
            if (!prev) return prev;
            return prev.map((t) =>
              t.id === location.truck_id
                ? {
                    ...t,
                    last_latitude: location.latitude,
                    last_longitude: location.longitude,
                    last_speed_kmh: location.speed_kmh,
                    last_heading: location.heading,
                    last_location_at: location.recorded_at,
                  }
                : t,
            );
          });
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [organizationId, queryClient, markUpdate, onLocation]);
}
