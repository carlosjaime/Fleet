"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/lib/auth/session";
import { assertCan, PermissionError } from "@/lib/permissions";
import { fuelLogSchema, type FuelLogInput } from "@/lib/validations/fuel";
import { fuelTotalCost } from "@/lib/utils/metrics";
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

export async function createFuelLog(input: FuelLogInput): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "fuel:write");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const parsed = fuelLogSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const totalCost = fuelTotalCost(parsed.data.liters, parsed.data.price_per_liter);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fuel_logs")
    .insert({
      organization_id: ctx.organization.id,
      truck_id: parsed.data.truck_id,
      driver_id: parsed.data.driver_id ?? null,
      liters: parsed.data.liters,
      price_per_liter: parsed.data.price_per_liter,
      total_cost: totalCost,
      odometer_km: parsed.data.odometer_km ?? null,
      fuel_station: toNullable(parsed.data.fuel_station),
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      recorded_at: toNullable(parsed.data.recorded_at) ?? new Date().toISOString(),
      created_by: ctx.user.id,
    })
    .select("id")
    .single();

  if (error) return { ok: false, message: "No se pudo registrar la carga de combustible." };

  // Actualiza el combustible actual y odómetro de la unidad si se reportó.
  if (parsed.data.odometer_km != null) {
    await supabase
      .from("trucks")
      .update({ odometer_km: parsed.data.odometer_km, current_fuel_pct: 100 })
      .eq("id", parsed.data.truck_id)
      .eq("organization_id", ctx.organization.id);
  }

  await logActivity(ctx, { action: "fuel.logged", entityType: "fuel_log", entityId: data.id });
  revalidatePath("/combustible");
  revalidatePath("/flota");
  return { ok: true, message: "Carga de combustible registrada." };
}
