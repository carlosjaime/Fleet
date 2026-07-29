"use client";

import { usePathname } from "next/navigation";
import { SEGMENT_LABELS } from "@/config/navigation";

/**
 * Título de la sección actual, visible solo en móvil. El Breadcrumb
 * completo se oculta en pantallas pequeñas por espacio, pero sin esto no
 * había ninguna indicación de en qué sección se está hasta hacer scroll
 * al contenido.
 */
export function MobilePageTitle() {
  const pathname = usePathname();
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  const label = firstSegment ? (SEGMENT_LABELS[firstSegment] ?? firstSegment) : "";

  if (!label) return null;

  return <p className="truncate text-sm font-semibold text-foreground md:hidden">{label}</p>;
}
