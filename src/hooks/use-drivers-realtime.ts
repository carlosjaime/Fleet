"use client";

/** Suscripción Realtime a cambios de conductores (asignaciones, estado). */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/config/env";
import { useRealtimeStatus } from "@/components/providers/realtime-provider";
import type { Driver } from "@/types/domain";

export const driversQueryKey = (organizationId: string) => ["drivers", organizationId] as const;

export function useDriversRealtime(organizationId: string) {
  const queryClient = useQueryClient();
  const { markUpdate } = useRealtimeStatus();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !organizationId) return;
    if (channelRef.current) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`org:${organizationId}:drivers`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drivers", filter: `organization_id=eq.${organizationId}` },
        (payload) => {
          markUpdate();
          queryClient.setQueryData<Driver[]>(driversQueryKey(organizationId), (prev) => {
            if (!prev) return prev;
            if (payload.eventType === "DELETE") {
              const old = payload.old as Partial<Driver>;
              return prev.filter((d) => d.id !== old.id);
            }
            const next = payload.new as Driver;
            const exists = prev.some((d) => d.id === next.id);
            return exists ? prev.map((d) => (d.id === next.id ? next : d)) : [...prev, next];
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
