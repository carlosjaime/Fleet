"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/lib/auth/session";
import { assertCan, PermissionError } from "@/lib/permissions";
import {
  truckSchema,
  changeTruckStatusSchema,
  assignDriverSchema,
  type TruckInput,
} from "@/lib/validations/fleet";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/services/activity-log";

export interface ActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Crea una unidad. Recibe un objeto tipado (no FormData): se invoca
 * directamente desde un Client Component que valida con React Hook Form +
 * Zod, pero la validación real y definitiva ocurre aquí en el servidor.
 */
export async function createTruck(input: TruckInput): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "fleet:write");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const parsed = truckSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trucks")
    .insert({ ...parsed.data, organization_id: ctx.organization.id })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "Ya existe una unidad con esa placa, número o VIN en tu organización." };
    }
    return { ok: false, message: "No se pudo crear la unidad." };
  }

  await logActivity(ctx, { action: "truck.created", entityType: "truck", entityId: data.id });
  revalidatePath("/flota");
  return { ok: true, message: "Unidad creada correctamente." };
}

export async function updateTruck(truckId: string, input: TruckInput): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "fleet:write");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const parsed = truckSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("trucks")
    .update(parsed.data)
    .eq("id", truckId)
    .eq("organization_id", ctx.organization.id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "Ya existe una unidad con esa placa, número o VIN en tu organización." };
    }
    return { ok: false, message: "No se pudo actualizar la unidad." };
  }

  await logActivity(ctx, { action: "truck.updated", entityType: "truck", entityId: truckId });
  revalidatePath("/flota");
  revalidatePath(`/flota/${truckId}`);
  return { ok: true, message: "Unidad actualizada." };
}

export async function changeTruckStatus(truckId: string, status: string): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "fleet:write");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const parsed = changeTruckStatusSchema.safeParse({ status });
  if (!parsed.success) return { ok: false, message: "Estado inválido" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("trucks")
    .update({ status: parsed.data.status })
    .eq("id", truckId)
    .eq("organization_id", ctx.organization.id);

  if (error) return { ok: false, message: "No se pudo cambiar el estado" };

  await logActivity(ctx, {
    action: "truck.status_changed",
    entityType: "truck",
    entityId: truckId,
    metadata: { status: parsed.data.status },
  });
  revalidatePath("/flota");
  revalidatePath(`/flota/${truckId}`);
  return { ok: true };
}

export async function assignDriverToTruck(truckId: string, driverId: string | null): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "fleet:write");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const parsed = assignDriverSchema.safeParse({ driver_id: driverId });
  if (!parsed.success) return { ok: false, message: "Conductor inválido" };

  const supabase = await createClient();

  if (parsed.data.driver_id) {
    const { data: driver } = await supabase
      .from("drivers")
      .select("status")
      .eq("id", parsed.data.driver_id)
      .eq("organization_id", ctx.organization.id)
      .maybeSingle();

    if (!driver) return { ok: false, message: "Conductor no encontrado" };
    if (driver.status === "suspended") {
      return { ok: false, message: "No se puede asignar un conductor suspendido" };
    }
  }

  const { error } = await supabase
    .from("trucks")
    .update({ active_driver_id: parsed.data.driver_id })
    .eq("id", truckId)
    .eq("organization_id", ctx.organization.id);

  if (error) return { ok: false, message: "No se pudo asignar el conductor" };

  await logActivity(ctx, {
    action: "truck.driver_assigned",
    entityType: "truck",
    entityId: truckId,
    metadata: { driverId: parsed.data.driver_id },
  });
  revalidatePath("/flota");
  revalidatePath(`/flota/${truckId}`);
  return { ok: true };
}

export async function deleteTruck(truckId: string): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "fleet:delete");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("trucks")
    .delete()
    .eq("id", truckId)
    .eq("organization_id", ctx.organization.id);

  if (error) return { ok: false, message: "No se pudo eliminar la unidad" };

  await logActivity(ctx, { action: "truck.deleted", entityType: "truck", entityId: truckId });
  revalidatePath("/flota");
  return { ok: true };
}
