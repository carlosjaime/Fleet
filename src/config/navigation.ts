import {
  LayoutDashboard,
  Truck,
  Users,
  Route as RouteIcon,
  Bell,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { OrgRole } from "@/types/domain";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Roles con acceso a la sección. `undefined` = todos los miembros. */
  roles?: readonly OrgRole[];
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Centro de control", href: "/dashboard", icon: LayoutDashboard },
  { label: "Flota", href: "/flota", icon: Truck },
  { label: "Conductores", href: "/conductores", icon: Users },
  { label: "Rutas", href: "/rutas", icon: RouteIcon },
  { label: "Alertas", href: "/alertas", icon: Bell },
  { label: "Mantenimiento", href: "/mantenimiento", icon: Wrench },
  { label: "Combustible", href: "/combustible", icon: Fuel },
  { label: "Analítica", href: "/analitica", icon: BarChart3 },
  { label: "Configuración", href: "/configuracion", icon: Settings },
] as const;

/** Etiquetas legibles para breadcrumbs por segmento de ruta. */
export const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Centro de control",
  flota: "Flota",
  conductores: "Conductores",
  rutas: "Rutas",
  alertas: "Alertas",
  mantenimiento: "Mantenimiento",
  combustible: "Combustible",
  analitica: "Analítica",
  configuracion: "Configuración",
  nuevo: "Nuevo",
};
