"use client";

/**
 * Suscripción Realtime a cambios de rutas (routes) de la organización activa.
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/config/env";
import { useRealtimeStatus } from "@/components/providers/realtime-provider";
import type { Route } from "@/types/domain";

export const routesQueryKey = (organizationId: string) => ["routes", organizationId] as const;

export function useRoutesRealtime(organizationId: string) {
  const queryClient = useQueryClient();
  const { markUpdate } = useRealtimeStatus();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !organizationId) return;
    if (channelRef.current) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`org:${organizationId}:routes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "routes", filter: `organization_id=eq.${organizationId}` },
        (payload) => {
          markUpdate();
          queryClient.setQueryData<Route[]>(routesQueryKey(organizationId), (prev) => {
            if (!prev) return prev;
            if (payload.eventType === "DELETE") {
              const old = payload.old as Partial<Route>;
              return prev.filter((r) => r.id !== old.id);
            }
            const next = payload.new as Route;
            const exists = prev.some((r) => r.id === next.id);
            return exists ? prev.map((r) => (r.id === next.id ? next : r)) : [next, ...prev];
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
