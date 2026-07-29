"use client";
import { type LucideIcon, Inbox, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils/cn";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--radius)] border border-dashed border-border bg-surface/50 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="rounded-full bg-surface-elevated p-3 text-muted">
        <Icon className="size-6" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? <p className="text-xs text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Ocurrió un error",
  description = "No se pudieron cargar los datos.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--radius)] border border-critical/30 bg-critical/5 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="rounded-full bg-critical/10 p-3 text-critical">
        <AlertTriangle className="size-6" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-4" /> Reintentar
        </Button>
      ) : null}
    </div>
  );
}

export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
