"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ACTIVE_ORG_COOKIE, getCurrentUser, getUserMemberships } from "@/lib/auth/session";

/**
 * Cambia la organización activa. Verifica que el usuario sea miembro antes
 * de persistir la preferencia en cookie. Nunca confía en el id sin validar.
 */
export async function setActiveOrganization(organizationId: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  const memberships = await getUserMemberships(user.id);
  const isMember = memberships.some((m) => m.organization?.id === organizationId);
  if (!isMember) return { ok: false };

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
  return { ok: true };
}
