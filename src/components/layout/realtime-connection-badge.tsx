"use client";

import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { useRealtimeStatus } from "@/components/providers/realtime-provider";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function RealtimeConnectionBadge({ showLabel = true }: { showLabel?: boolean }) {
  const { status, lastUpdateAt } = useRealtimeStatus();

  const map = {
    connecting: { variant: "warning" as const, icon: Loader2, label: "Conectando", spin: true },
    connected: { variant: "success" as const, icon: Wifi, label: "En vivo", spin: false },
    disconnected: { variant: "critical" as const, icon: WifiOff, label: "Sin conexión", spin: false },
  }[status];

  const Icon = map.icon;
  return (
    <div className="flex items-center gap-2">
      <Badge variant={map.variant} aria-live="polite">
        <Icon className={cn("size-3", map.spin && "animate-spin")} />
        {showLabel ? map.label : null}
      </Badge>
      {lastUpdateAt && showLabel ? (
        <span className="hidden text-xs text-muted sm:inline">
          Últ. dato {formatRelativeTime(lastUpdateAt)}
        </span>
      ) : null}
    </div>
  );
}
