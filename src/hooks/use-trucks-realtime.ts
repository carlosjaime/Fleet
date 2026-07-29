"use client";

/**
 * Suscripción Realtime a cambios de unidades (trucks) de la organización
 * activa. Actualiza la caché de TanStack Query en lugar de recargar la
 * página. Limpia el canal al desmontar.
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/config/env";
import { useRealtimeStatus } from "@/components/providers/realtime-provider";
import type { Truck } from "@/types/domain";

export const trucksQueryKey = (organizationId: string) => ["trucks", organizationId] as const;

export function useTrucksRealtime(organizationId: string) {
  const queryClient = useQueryClient();
  const { markUpdate } = useRealtimeStatus();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !organizationId) return;
    if (channelRef.current) return; // evita suscripciones duplicadas

    const supabase = createClient();
    const channel = supabase
      .channel(`org:${organizationId}:trucks`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trucks", filter: `organization_id=eq.${organizationId}` },
        (payload) => {
          markUpdate();
          queryClient.setQueryData<Truck[]>(trucksQueryKey(organizationId), (prev) => {
            if (!prev) return prev;
            if (payload.eventType === "DELETE") {
              const old = payload.old as Partial<Truck>;
              return prev.filter((t) => t.id !== old.id);
            }
            const next = payload.new as Truck;
            const exists = prev.some((t) => t.id === next.id);
            return exists ? prev.map((t) => (t.id === next.id ? next : t)) : [...prev, next];
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
  }, [organizationId, queryClient, markUpdate]);
}
