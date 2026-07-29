"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/lib/auth/session";
import { assertCan, PermissionError } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/services/activity-log";

export interface ActionResult {
  ok: boolean;
  message?: string;
}

export async function acknowledgeAlert(alertId: string): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "alerts:acknowledge");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { data: alert } = await supabase
    .from("alerts")
    .select("status")
    .eq("id", alertId)
    .eq("organization_id", ctx.organization.id)
    .maybeSingle();

  if (!alert) return { ok: false, message: "Alerta no encontrada." };
  if (alert.status !== "open") return { ok: false, message: "Solo se pueden reconocer alertas abiertas." };

  const { error } = await supabase
    .from("alerts")
    .update({ status: "acknowledged", acknowledged_at: new Date().toISOString(), acknowledged_by: ctx.user.id })
    .eq("id", alertId)
    .eq("organization_id", ctx.organization.id);

  if (error) return { ok: false, message: "No se pudo reconocer la alerta." };

  await logActivity(ctx, { action: "alert.acknowledged", entityType: "alert", entityId: alertId });
  revalidatePath("/alertas");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function resolveAlert(alertId: string, resolutionNotes?: string): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "alerts:resolve");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { data: alert } = await supabase
    .from("alerts")
    .select("status")
    .eq("id", alertId)
    .eq("organization_id", ctx.organization.id)
    .maybeSingle();

  if (!alert) return { ok: false, message: "Alerta no encontrada." };
  if (alert.status === "resolved") return { ok: false, message: "La alerta ya está resuelta." };

  const { error } = await supabase
    .from("alerts")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      resolved_by: ctx.user.id,
      resolution_notes: resolutionNotes?.trim() || null,
    })
    .eq("id", alertId)
    .eq("organization_id", ctx.organization.id);

  if (error) return { ok: false, message: "No se pudo resolver la alerta." };

  await logActivity(ctx, { action: "alert.resolved", entityType: "alert", entityId: alertId });
  revalidatePath("/alertas");
  revalidatePath("/dashboard");
  return { ok: true };
}
