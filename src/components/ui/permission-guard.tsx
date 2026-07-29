"use client";

import { usePermission } from "@/components/providers/org-provider";
import type { Permission } from "@/lib/permissions";

/**
 * Oculta o reemplaza contenido según el permiso del usuario activo.
 * Esto es sólo UX: la autorización real vive en el servidor y en RLS.
 */
export function PermissionGuard({
  permission,
  fallback = null,
  children,
}: {
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const allowed = usePermission(permission);
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
