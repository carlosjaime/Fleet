import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  trend?: { value: number; label?: string };
  accent?: "amber" | "cyan" | "success" | "critical" | "info" | "muted";
  className?: string;
}

const ACCENT: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  amber: "text-amber",
  cyan: "text-cyan",
  success: "text-success",
  critical: "text-critical",
  info: "text-info",
  muted: "text-muted",
};

export function KpiCard({ label, value, icon: Icon, hint, trend, accent = "cyan", className }: KpiCardProps) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
          <p className="telemetry mt-2 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        {Icon ? (
          <span className={cn("rounded-md bg-surface-elevated p-2", ACCENT[accent])}>
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
      </div>
      {(hint || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend ? <StatTrend value={trend.value} label={trend.label} /> : null}
          {hint ? <span className="text-muted">{hint}</span> : null}
        </div>
      )}
    </Card>
  );
}

export function StatTrend({ value, label }: { value: number; label?: string }) {
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  const color = value > 0 ? "text-success" : value < 0 ? "text-critical" : "text-muted";
  return (
    <span className={cn("inline-flex items-center gap-1 font-medium", color)}>
      <Icon className="size-3.5" aria-hidden />
      {value > 0 ? "+" : ""}
      {value}%{label ? <span className="text-muted">{label}</span> : null}
    </span>
  );
}
