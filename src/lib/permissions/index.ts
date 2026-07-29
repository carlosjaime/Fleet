/**
 * Sistema centralizado de permisos y roles.
 *
 * La misma matriz se usa en el cliente (para ocultar/deshabilitar acciones)
 * y en el servidor (para autorizar mutaciones). La autorización real y
 * definitiva vive además en las políticas RLS de PostgreSQL: esto es la
 * capa de aplicación, no la única defensa.
 */
import type { OrgRole } from "@/types/domain";

export const ORG_ROLES: readonly OrgRole[] = [
  "owner",
  "admin",
  "dispatcher",
  "operator",
  "viewer",
] as const;

/** Jerarquía numérica: mayor = más privilegios. */
const ROLE_RANK: Record<OrgRole, number> = {
  viewer: 0,
  operator: 1,
  dispatcher: 2,
  admin: 3,
  owner: 4,
};

export const ROLE_LABELS: Record<OrgRole, string> = {
  owner: "Propietario",
  admin: "Administrador",
  dispatcher: "Despachador",
  operator: "Operador",
  viewer: "Consulta",
};

/**
 * Permisos atómicos del dominio. El recurso y la acción quedan explícitos
 * para facilitar la lectura de la matriz.
 */
export type Permission =
  | "fleet:read"
  | "fleet:write"
  | "fleet:delete"
  | "drivers:read"
  | "drivers:write"
  | "drivers:delete"
  | "routes:read"
  | "routes:write"
  | "routes:manage" // iniciar/pausar/completar/cancelar
  | "alerts:read"
  | "alerts:acknowledge"
  | "alerts:resolve"
  | "maintenance:read"
  | "maintenance:write"
  | "fuel:read"
  | "fuel:write"
  | "analytics:read"
  | "members:read"
  | "members:manage" // invitar, cambiar roles, remover
  | "settings:read"
  | "settings:write"
  | "apikeys:manage";

/** Rol mínimo requerido para cada permiso. */
const MIN_ROLE: Record<Permission, OrgRole> = {
  "fleet:read": "viewer",
  "fleet:write": "dispatcher",
  "fleet:delete": "admin",
  "drivers:read": "viewer",
  "drivers:write": "dispatcher",
  "drivers:delete": "admin",
  "routes:read": "viewer",
  "routes:write": "dispatcher",
  "routes:manage": "dispatcher",
  "alerts:read": "viewer",
  "alerts:acknowledge": "operator",
  "alerts:resolve": "operator",
  "maintenance:read": "viewer",
  "maintenance:write": "dispatcher",
  "fuel:read": "viewer",
  "fuel:write": "operator",
  "analytics:read": "viewer",
  "members:read": "operator",
  "members:manage": "admin",
  "settings:read": "operator",
  "settings:write": "admin",
  "apikeys:manage": "admin",
};

export function roleRank(role: OrgRole): number {
  return ROLE_RANK[role];
}

/** ¿El rol tiene al menos el rango del rol requerido? */
export function roleAtLeast(role: OrgRole, minimum: OrgRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

/** ¿El rol cuenta con el permiso indicado? */
export function can(role: OrgRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[MIN_ROLE[permission]];
}

/** Igual que `can` pero lanza. Útil en Server Actions y Route Handlers. */
export function assertCan(role: OrgRole | null | undefined, permission: Permission): void {
  if (!can(role, permission)) {
    throw new PermissionError(permission);
  }
}

export class PermissionError extends Error {
  readonly permission: Permission;
  constructor(permission: Permission) {
    super(`Permisos insuficientes para: ${permission}`);
    this.name = "PermissionError";
    this.permission = permission;
  }
}
