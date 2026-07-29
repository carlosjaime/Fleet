"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/lib/auth/session";
import { assertCan, PermissionError } from "@/lib/permissions";
import { maintenanceSchema, type MaintenanceInput } from "@/lib/validations/maintenance";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/services/activity-log";

export interface ActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

function toNullable(value: string | undefined | null) {
  return value && value.trim() !== "" ? value : null;
}

export async function createMaintenance(input: MaintenanceInput): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "maintenance:write");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const parsed = maintenanceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance_records")
    .insert({
      organization_id: ctx.organization.id,
      truck_id: parsed.data.truck_id,
      type: parsed.data.type,
      description: toNullable(parsed.data.description),
      status: parsed.data.status,
      scheduled_at: toNullable(parsed.data.scheduled_at),
      completed_at: toNullable(parsed.data.completed_at),
      odometer_at_service: parsed.data.odometer_at_service ?? null,
      next_service_odometer: parsed.data.next_service_odometer ?? null,
      next_service_date: toNullable(parsed.data.next_service_date),
      cost: parsed.data.cost ?? null,
      provider: toNullable(parsed.data.provider),
      notes: toNullable(parsed.data.notes),
      created_by: ctx.user.id,
    })
    .select("id")
    .single();

  if (error) return { ok: false, message: "No se pudo registrar el mantenimiento." };

  if (parsed.data.status === "in_progress") {
    await supabase
      .from("trucks")
      .update({ status: "maintenance" })
      .eq("id", parsed.data.truck_id)
      .eq("organization_id", ctx.organization.id);
  }

  await logActivity(ctx, { action: "maintenance.created", entityType: "maintenance", entityId: data.id });
  revalidatePath("/mantenimiento");
  revalidatePath("/flota");
  return { ok: true, message: "Mantenimiento registrado." };
}

export async function updateMaintenanceStatus(
  recordId: string,
  status: "scheduled" | "in_progress" | "completed" | "cancelled",
): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "maintenance:write");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { data: record } = await supabase
    .from("maintenance_records")
    .select("truck_id")
    .eq("id", recordId)
    .eq("organization_id", ctx.organization.id)
    .maybeSingle();

  if (!record) return { ok: false, message: "Registro no encontrado." };

  const patch: { status: typeof status; completed_at?: string } = { status };
  if (status === "completed") patch.completed_at = new Date().toISOString();

  const { error } = await supabase
    .from("maintenance_records")
    .update(patch)
    .eq("id", recordId)
    .eq("organization_id", ctx.organization.id);

  if (error) return { ok: false, message: "No se pudo actualizar el mantenimiento." };

  // Sincroniza el estado de la unidad: en proceso -> maintenance,
  // completado/cancelado -> vuelve a idle (si estaba en maintenance).
  if (status === "in_progress") {
    await supabase
      .from("trucks")
      .update({ status: "maintenance" })
      .eq("id", record.truck_id)
      .eq("organization_id", ctx.organization.id);
  } else if (status === "completed" || status === "cancelled") {
    await supabase
      .from("trucks")
      .update({ status: "idle" })
      .eq("id", record.truck_id)
      .eq("organization_id", ctx.organization.id)
      .eq("status", "maintenance");
  }

  await logActivity(ctx, {
    action: "maintenance.status_changed",
    entityType: "maintenance",
    entityId: recordId,
    metadata: { status },
  });
  revalidatePath("/mantenimiento");
  revalidatePath("/flota");
  return { ok: true };
}
