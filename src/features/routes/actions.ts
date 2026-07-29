"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/lib/auth/session";
import { assertCan, PermissionError } from "@/lib/permissions";
import { routeSchema, type RouteInput } from "@/lib/validations/routes";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/services/activity-log";
import {
  canTransition,
  applyTransition,
  type RouteAction,
  InvalidRouteTransitionError,
} from "@/lib/routes/state-machine";
import type { RouteStatus } from "@/types/domain";

export interface ActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

function toNullable(value: string | undefined | null) {
  return value && value.trim() !== "" ? value : null;
}

export async function createRoute(input: RouteInput): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "routes:write");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const parsed = routeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { waypoints, ...routeData } = parsed.data;

  const { data, error } = await supabase
    .from("routes")
    .insert({
      organization_id: ctx.organization.id,
      name: routeData.name,
      reference: toNullable(routeData.reference),
      origin_name: routeData.origin_name,
      origin_latitude: routeData.origin_latitude,
      origin_longitude: routeData.origin_longitude,
      destination_name: routeData.destination_name,
      destination_latitude: routeData.destination_latitude,
      destination_longitude: routeData.destination_longitude,
      truck_id: routeData.truck_id ?? null,
      driver_id: routeData.driver_id ?? null,
      priority: routeData.priority,
      scheduled_start_at: toNullable(routeData.scheduled_start_at),
      scheduled_end_at: toNullable(routeData.scheduled_end_at),
      estimated_distance_km: routeData.estimated_distance_km ?? null,
      estimated_duration_minutes: routeData.estimated_duration_minutes ?? null,
      notes: toNullable(routeData.notes),
      created_by: ctx.user.id,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) return { ok: false, message: "No se pudo crear la ruta." };

  if (waypoints && waypoints.length > 0) {
    await supabase.from("route_waypoints").insert(
      waypoints.map((w) => ({
        route_id: data.id,
        organization_id: ctx.organization.id,
        sequence: w.sequence,
        name: w.name,
        latitude: w.latitude,
        longitude: w.longitude,
      })),
    );
  }

  await logActivity(ctx, { action: "route.created", entityType: "route", entityId: data.id });
  revalidatePath("/rutas");
  return { ok: true, message: "Ruta creada correctamente." };
}

export async function updateRoute(routeId: string, input: RouteInput): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "routes:write");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const parsed = routeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("routes")
    .select("status")
    .eq("id", routeId)
    .eq("organization_id", ctx.organization.id)
    .maybeSingle();

  if (!existing) return { ok: false, message: "Ruta no encontrada." };
  if (existing.status === "completed" || existing.status === "cancelled") {
    return { ok: false, message: "No se puede editar una ruta completada o cancelada." };
  }

  const { waypoints, ...routeData } = parsed.data;

  const { error } = await supabase
    .from("routes")
    .update({
      name: routeData.name,
      reference: toNullable(routeData.reference),
      origin_name: routeData.origin_name,
      origin_latitude: routeData.origin_latitude,
      origin_longitude: routeData.origin_longitude,
      destination_name: routeData.destination_name,
      destination_latitude: routeData.destination_latitude,
      destination_longitude: routeData.destination_longitude,
      truck_id: routeData.truck_id ?? null,
      driver_id: routeData.driver_id ?? null,
      priority: routeData.priority,
      scheduled_start_at: toNullable(routeData.scheduled_start_at),
      scheduled_end_at: toNullable(routeData.scheduled_end_at),
      estimated_distance_km: routeData.estimated_distance_km ?? null,
      estimated_duration_minutes: routeData.estimated_duration_minutes ?? null,
      notes: toNullable(routeData.notes),
    })
    .eq("id", routeId)
    .eq("organization_id", ctx.organization.id);

  if (error) return { ok: false, message: "No se pudo actualizar la ruta." };

  if (waypoints) {
    await supabase.from("route_waypoints").delete().eq("route_id", routeId);
    if (waypoints.length > 0) {
      await supabase.from("route_waypoints").insert(
        waypoints.map((w) => ({
          route_id: routeId,
          organization_id: ctx.organization.id,
          sequence: w.sequence,
          name: w.name,
          latitude: w.latitude,
          longitude: w.longitude,
        })),
      );
    }
  }

  await logActivity(ctx, { action: "route.updated", entityType: "route", entityId: routeId });
  revalidatePath("/rutas");
  revalidatePath(`/rutas/${routeId}`);
  return { ok: true, message: "Ruta actualizada." };
}

const ACTION_ACTIVITY: Record<RouteAction, string> = {
  schedule: "route.scheduled",
  start: "route.started",
  pause: "route.paused",
  resume: "route.resumed",
  complete: "route.completed",
  cancel: "route.cancelled",
};

export async function transitionRoute(routeId: string, action: RouteAction): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "routes:manage");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { data: route } = await supabase
    .from("routes")
    .select("id, status, truck_id, driver_id")
    .eq("id", routeId)
    .eq("organization_id", ctx.organization.id)
    .maybeSingle();

  if (!route) return { ok: false, message: "Ruta no encontrada." };

  if (!canTransition(route.status as RouteStatus, action)) {
    const err = new InvalidRouteTransitionError(route.status as RouteStatus, action);
    return { ok: false, message: err.message };
  }

  // Reglas de negocio adicionales para iniciar una ruta.
  if (action === "start") {
    if (!route.truck_id || !route.driver_id) {
      return { ok: false, message: "Asigna una unidad y un conductor antes de iniciar la ruta." };
    }
    const [{ data: truck }, { data: driver }] = await Promise.all([
      supabase.from("trucks").select("status").eq("id", route.truck_id).single(),
      supabase.from("drivers").select("status").eq("id", route.driver_id).single(),
    ]);
    if (truck?.status === "maintenance") {
      return { ok: false, message: "La unidad está en mantenimiento y no puede iniciar una ruta." };
    }
    if (driver?.status === "suspended") {
      return { ok: false, message: "El conductor está suspendido y no puede iniciar una ruta." };
    }
  }

  const { status, patch } = applyTransition(route.status as RouteStatus, action);

  const { error } = await supabase
    .from("routes")
    .update({ status, ...patch })
    .eq("id", routeId)
    .eq("organization_id", ctx.organization.id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "La unidad o el conductor ya tienen una ruta activa." };
    }
    return { ok: false, message: "No se pudo actualizar la ruta." };
  }

  await logActivity(ctx, {
    action: ACTION_ACTIVITY[action],
    entityType: "route",
    entityId: routeId,
    metadata: { from: route.status, to: status },
  });
  revalidatePath("/rutas");
  revalidatePath(`/rutas/${routeId}`);
  return { ok: true };
}

export async function deleteRoute(routeId: string): Promise<ActionResult> {
  const ctx = await getSessionContext();
  try {
    assertCan(ctx.role, "fleet:delete");
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("routes")
    .delete()
    .eq("id", routeId)
    .eq("organization_id", ctx.organization.id);

  if (error) return { ok: false, message: "No se pudo eliminar la ruta." };

  await logActivity(ctx, { action: "route.deleted", entityType: "route", entityId: routeId });
  revalidatePath("/rutas");
  return { ok: true };
}
