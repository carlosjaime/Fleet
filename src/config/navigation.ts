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

export interface NavGroup {
  label: string;
  items: readonly NavItem[];
}

/**
 * Agrupación de la navegación principal para el sidebar: separa la
 * operación diaria (lo que se consulta a cada momento) de la gestión
 * periódica (lo que se revisa con menos frecuencia). Facilita ubicar una
 * sección de un vistazo en vez de escanear una lista plana de 9 ítems.
 */
export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: "Operación",
    items: NAV_ITEMS.slice(0, 5), // Centro de control, Flota, Conductores, Rutas, Alertas
  },
  {
    label: "Gestión",
    items: NAV_ITEMS.slice(5), // Mantenimiento, Combustible, Analítica, Configuración
  },
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
