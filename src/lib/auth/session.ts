/**
 * Helpers de sesión y contexto de organización para el servidor.
 *
 * La organización activa se guarda en una cookie firmada por el navegador
 * pero SIEMPRE se re-verifica contra la membresía real del usuario en la
 * base de datos (con RLS). Nunca se confía en el `organization_id` del
 * cliente sin comprobar membresía y rol.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { OrgRole, Organization } from "@/types/domain";

export const ACTIVE_ORG_COOKIE = "fleetops-active-org";

export interface SessionContext {
  user: User;
  organization: Organization;
  role: OrgRole;
  membershipId: string;
}

/** Usuario autenticado o null. Cacheado por request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

interface MembershipRow {
  id: string;
  role: OrgRole;
  status: string;
  organization: Organization | null;
}

/** Membresías activas del usuario con su organización. */
export async function getUserMemberships(userId: string): Promise<MembershipRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("id, role, status, organization:organizations(*)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .returns<MembershipRow[]>();

  if (error) throw error;
  return (data ?? []).filter((m) => m.organization !== null);
}

/**
 * Resuelve el contexto completo de la sesión (usuario + organización activa
 * + rol). Redirige a /login si no hay sesión y a onboarding si no hay
 * organización. La organización activa se toma de la cookie si el usuario es
 * miembro; de lo contrario se usa la primera membresía.
 */
export const getSessionContext = cache(async (): Promise<SessionContext> => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const memberships = await getUserMemberships(user.id);
  if (memberships.length === 0) {
    // Sin organización activa: enviar a acceso denegado con contexto.
    redirect("/acceso-denegado?motivo=sin-organizacion");
  }

  const cookieStore = await cookies();
  const preferredOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  const active =
    memberships.find((m) => m.organization && m.organization.id === preferredOrgId) ??
    memberships[0]!;

  return {
    user,
    organization: active.organization as Organization,
    role: active.role,
    membershipId: active.id,
  };
});

/** Igual que getSessionContext pero exige uno de los roles permitidos. */
export async function requireRole(allowed: readonly OrgRole[]): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!allowed.includes(ctx.role)) {
    redirect("/acceso-denegado?motivo=rol-insuficiente");
  }
  return ctx;
}
