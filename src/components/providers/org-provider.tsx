"use client";

/**
 * Contexto de la organización activa y del rol del usuario para el cliente.
 * Provee helpers de permisos y datos de conexión Realtime a toda la app.
 */
import { createContext, useContext } from "react";
import type { OrgRole, Organization } from "@/types/domain";
import { can, type Permission } from "@/lib/permissions";

interface OrgContextValue {
  organizationId: string;
  organization: Organization;
  role: OrgRole;
  userId: string;
  userName: string;
  userEmail: string;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({
  value,
  children,
}: {
  value: OrgContextValue;
  children: React.ReactNode;
}) {
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg(): OrgContextValue {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg debe usarse dentro de OrgProvider");
  return ctx;
}

/** Hook de permisos basado en el rol activo. */
export function usePermission(permission: Permission): boolean {
  const { role } = useOrg();
  return can(role, permission);
}
