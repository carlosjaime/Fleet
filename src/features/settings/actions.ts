"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/lib/auth/session";
import { assertCan, PermissionError, ORG_ROLES } from "@/lib/permissions";
import {
  orgSettingsSchema,
  organizationSchema,
  inviteMemberSchema,
  changeMemberRoleSchema,
  createApiKeySchema,
  type OrgSettingsInput,
  type OrganizationInput,
} from "@/lib/validations/settings";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateApiKey } from "@/lib/auth/api-keys";
import { logActivity } from "@/lib/services/activity-log";
import type { OrgRole } from "@/types/domain";

export interface ActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export interface CreateApiKeyResult extends ActionResult {
  plainKey?: string;
}

export async function updateOrganizationSettings(input: OrgSettingsInput): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "settings:write");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const parsed = orgSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_settings")
    .update(parsed.data)
    .eq("organization_id", ctx.organization.id);

  if (error) return { ok: false, message: "No se pudo actualizar la configuración." };

  await logActivity(ctx, { action: "settings.updated", entityType: "organization", entityId: ctx.organization.id });
  revalidatePath("/configuracion");
  return { ok: true, message: "Configuración actualizada." };
}

export async function updateOrganizationProfile(input: OrganizationInput): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "settings:write");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const parsed = organizationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update(parsed.data)
    .eq("id", ctx.organization.id);

  if (error) return { ok: false, message: "No se pudo actualizar la empresa." };

  revalidatePath("/configuracion");
  revalidatePath("/", "layout");
  return { ok: true, message: "Empresa actualizada." };
}

export async function inviteMember(email: string, role: string): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "members:manage");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const parsed = inviteMemberSchema.safeParse({ email, role });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const admin = createAdminClient();
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(parsed.data.email);

  if (inviteError || !invited.user) {
    return { ok: false, message: "No se pudo invitar al usuario. Verifica que el correo sea válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("organization_members").insert({
    organization_id: ctx.organization.id,
    user_id: invited.user.id,
    role: parsed.data.role as OrgRole,
    status: "invited",
  });

  if (error) {
    if (error.code === "23505") return { ok: false, message: "Este usuario ya pertenece a la organización." };
    return { ok: false, message: "No se pudo crear la membresía." };
  }

  await logActivity(ctx, {
    action: "member.invited",
    entityType: "organization_member",
    metadata: { email: parsed.data.email, role: parsed.data.role },
  });
  revalidatePath("/configuracion");
  return { ok: true, message: "Invitación enviada." };
}

export async function changeMemberRole(memberId: string, role: string): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "members:manage");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const parsed = changeMemberRoleSchema.safeParse({ member_id: memberId, role });
  if (!parsed.success) return { ok: false, message: "Datos inválidos." };
  if (!ORG_ROLES.includes(parsed.data.role as OrgRole)) return { ok: false, message: "Rol inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_members")
    .update({ role: parsed.data.role as OrgRole })
    .eq("id", parsed.data.member_id)
    .eq("organization_id", ctx.organization.id);

  if (error) return { ok: false, message: "No se pudo actualizar el rol." };

  await logActivity(ctx, {
    action: "member.role_changed",
    entityType: "organization_member",
    entityId: memberId,
    metadata: { role: parsed.data.role },
  });
  revalidatePath("/configuracion");
  return { ok: true };
}

export async function removeMember(memberId: string): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "members:manage");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", memberId)
    .eq("organization_id", ctx.organization.id);

  if (error) return { ok: false, message: "No se pudo eliminar la membresía." };

  await logActivity(ctx, { action: "member.removed", entityType: "organization_member", entityId: memberId });
  revalidatePath("/configuracion");
  return { ok: true };
}

export async function createApiKey(name: string, truckId: string | null): Promise<CreateApiKeyResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "apikeys:manage");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const parsed = createApiKeySchema.safeParse({ name, truck_id: truckId });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const generated = await generateApiKey();

  const supabase = await createClient();
  const { error } = await supabase.from("device_api_keys").insert({
    organization_id: ctx.organization.id,
    truck_id: parsed.data.truck_id ?? null,
    name: parsed.data.name,
    key_prefix: generated.keyPrefix,
    key_hash: generated.keyHash,
    created_by: ctx.user.id,
  });

  if (error) return { ok: false, message: "No se pudo crear la API key." };

  await logActivity(ctx, { action: "apikey.created", entityType: "device_api_key" });
  revalidatePath("/configuracion");
  return { ok: true, plainKey: generated.plainKey, message: "API key creada. Cópiala ahora, no se mostrará de nuevo." };
}

export async function revokeApiKey(keyId: string): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "apikeys:manage");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("device_api_keys")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("organization_id", ctx.organization.id);

  if (error) return { ok: false, message: "No se pudo revocar la API key." };

  await logActivity(ctx, { action: "apikey.revoked", entityType: "device_api_key", entityId: keyId });
  revalidatePath("/configuracion");
  return { ok: true };
}
