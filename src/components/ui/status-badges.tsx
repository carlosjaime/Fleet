import { Badge } from "./badge";
import type {
  TruckStatus,
  DriverStatus,
  RouteStatus,
  AlertSeverity,
  AlertStatus,
  MaintenanceStatus,
  OrgRole,
} from "@/types/domain";
import { ROLE_LABELS } from "@/lib/permissions";

type Variant = React.ComponentProps<typeof Badge>["variant"];

const TRUCK: Record<TruckStatus, { label: string; variant: Variant }> = {
  active: { label: "Activo", variant: "success" },
  idle: { label: "Inactivo", variant: "muted" },
  offline: { label: "Sin señal", variant: "critical" },
  maintenance: { label: "Mantenimiento", variant: "warning" },
};

const DRIVER: Record<DriverStatus, { label: string; variant: Variant }> = {
  available: { label: "Disponible", variant: "success" },
  assigned: { label: "Asignado", variant: "cyan" },
  off_duty: { label: "Fuera de turno", variant: "muted" },
  suspended: { label: "Suspendido", variant: "critical" },
};

const ROUTE: Record<RouteStatus, { label: string; variant: Variant }> = {
  draft: { label: "Borrador", variant: "muted" },
  scheduled: { label: "Programada", variant: "info" },
  in_progress: { label: "En progreso", variant: "cyan" },
  paused: { label: "Pausada", variant: "warning" },
  completed: { label: "Completada", variant: "success" },
  cancelled: { label: "Cancelada", variant: "critical" },
};

const SEVERITY: Record<AlertSeverity, { label: string; variant: Variant }> = {
  info: { label: "Informativa", variant: "info" },
  warning: { label: "Advertencia", variant: "warning" },
  critical: { label: "Crítica", variant: "critical" },
};

const ALERT_STATUS: Record<AlertStatus, { label: string; variant: Variant }> = {
  open: { label: "Abierta", variant: "critical" },
  acknowledged: { label: "Reconocida", variant: "warning" },
  resolved: { label: "Resuelta", variant: "success" },
};

const MAINTENANCE: Record<MaintenanceStatus, { label: string; variant: Variant }> = {
  scheduled: { label: "Programado", variant: "info" },
  in_progress: { label: "En proceso", variant: "cyan" },
  completed: { label: "Completado", variant: "success" },
  cancelled: { label: "Cancelado", variant: "muted" },
  overdue: { label: "Vencido", variant: "critical" },
};

export function TruckStatusBadge({ status }: { status: TruckStatus }) {
  const s = TRUCK[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
export function DriverStatusBadge({ status }: { status: DriverStatus }) {
  const s = DRIVER[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
export function RouteStatusBadge({ status }: { status: RouteStatus }) {
  const s = ROUTE[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
export function AlertSeverityBadge({ severity }: { severity: AlertSeverity }) {
  const s = SEVERITY[severity];
  // No depende solo del color: incluye texto explícito.
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  const s = ALERT_STATUS[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  const s = MAINTENANCE[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
export function RoleBadge({ role }: { role: OrgRole }) {
  return <Badge variant="muted">{ROLE_LABELS[role]}</Badge>;
}
