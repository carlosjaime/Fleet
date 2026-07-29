"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/lib/auth/session";
import { assertCan, PermissionError } from "@/lib/permissions";
import { driverSchema, type DriverInput } from "@/lib/validations/drivers";
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

export async function createDriver(input: DriverInput): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "drivers:write");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const parsed = driverSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drivers")
    .insert({
      organization_id: ctx.organization.id,
      full_name: parsed.data.full_name,
      email: toNullable(parsed.data.email),
      phone: toNullable(parsed.data.phone),
      license_number: toNullable(parsed.data.license_number),
      license_type: toNullable(parsed.data.license_type),
      license_expiration: toNullable(parsed.data.license_expiration),
      status: parsed.data.status,
      emergency_contact: toNullable(parsed.data.emergency_contact),
    })
    .select("id")
    .single();

  if (error) return { ok: false, message: "No se pudo crear el conductor." };

  await logActivity(ctx, { action: "driver.created", entityType: "driver", entityId: data.id });
  revalidatePath("/conductores");
  return { ok: true, message: "Conductor creado correctamente." };
}

export async function updateDriver(driverId: string, input: DriverInput): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "drivers:write");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const parsed = driverSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("drivers")
    .update({
      full_name: parsed.data.full_name,
      email: toNullable(parsed.data.email),
      phone: toNullable(parsed.data.phone),
      license_number: toNullable(parsed.data.license_number),
      license_type: toNullable(parsed.data.license_type),
      license_expiration: toNullable(parsed.data.license_expiration),
      status: parsed.data.status,
      emergency_contact: toNullable(parsed.data.emergency_contact),
    })
    .eq("id", driverId)
    .eq("organization_id", ctx.organization.id);

  if (error) return { ok: false, message: "No se pudo actualizar el conductor." };

  await logActivity(ctx, { action: "driver.updated", entityType: "driver", entityId: driverId });
  revalidatePath("/conductores");
  revalidatePath(`/conductores/${driverId}`);
  return { ok: true, message: "Conductor actualizado." };
}

async function setDriverStatus(driverId: string, status: "available" | "suspended"): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "drivers:write");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const supabase = await createClient();

  // Un conductor suspendido no puede seguir asignado a una unidad activa.
  if (status === "suspended") {
    await supabase
      .from("trucks")
      .update({ active_driver_id: null })
      .eq("organization_id", ctx.organization.id)
      .eq("active_driver_id", driverId);
  }

  const { error } = await supabase
    .from("drivers")
    .update({ status })
    .eq("id", driverId)
    .eq("organization_id", ctx.organization.id);

  if (error) return { ok: false, message: "No se pudo actualizar el estado." };

  await logActivity(ctx, {
    action: status === "suspended" ? "driver.suspended" : "driver.reactivated",
    entityType: "driver",
    entityId: driverId,
  });
  revalidatePath("/conductores");
  revalidatePath(`/conductores/${driverId}`);
  return { ok: true };
}

export async function suspendDriver(driverId: string): Promise<ActionResult> {
  return setDriverStatus(driverId, "suspended");
}

export async function reactivateDriver(driverId: string): Promise<ActionResult> {
  return setDriverStatus(driverId, "available");
}

export async function deleteDriver(driverId: string): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "drivers:delete");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("drivers")
    .delete()
    .eq("id", driverId)
    .eq("organization_id", ctx.organization.id);

  if (error) return { ok: false, message: "No se pudo eliminar el conductor." };

  await logActivity(ctx, { action: "driver.deleted", entityType: "driver", entityId: driverId });
  revalidatePath("/conductores");
  return { ok: true };
}
