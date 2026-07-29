"use client";

/**
 * Suscripción Realtime a alertas (alerts) de la organización activa.
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/config/env";
import { useRealtimeStatus } from "@/components/providers/realtime-provider";
import type { Alert } from "@/types/domain";

export const alertsQueryKey = (organizationId: string) => ["alerts", organizationId] as const;

export function useAlertsRealtime(organizationId: string, onNewAlert?: (alert: Alert) => void) {
  const queryClient = useQueryClient();
  const { markUpdate } = useRealtimeStatus();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !organizationId) return;
    if (channelRef.current) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`org:${organizationId}:alerts`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts", filter: `organization_id=eq.${organizationId}` },
        (payload) => {
          markUpdate();
          queryClient.setQueryData<Alert[]>(alertsQueryKey(organizationId), (prev) => {
            if (!prev) return prev;
            if (payload.eventType === "DELETE") {
              const old = payload.old as Partial<Alert>;
              return prev.filter((a) => a.id !== old.id);
            }
            const next = payload.new as Alert;
            const exists = prev.some((a) => a.id === next.id);
            if (payload.eventType === "INSERT" && !exists) onNewAlert?.(next);
            return exists ? prev.map((a) => (a.id === next.id ? next : a)) : [next, ...prev];
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
  }, [organizationId, queryClient, markUpdate, onNewAlert]);
}
