import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Route, RouteWaypoint } from "@/types/domain";

export interface RouteWithRelations extends Route {
  truck: { id: string; unit_number: string; name: string } | null;
  driver: { id: string; full_name: string } | null;
}

export async function listRoutes(organizationId: string): Promise<RouteWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("routes")
    .select("*, truck:trucks(id, unit_number, name), driver:drivers(id, full_name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .returns<RouteWithRelations[]>();

  if (error) throw error;
  return data ?? [];
}

export async function getRoute(organizationId: string, routeId: string): Promise<RouteWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("routes")
    .select("*, truck:trucks(id, unit_number, name), driver:drivers(id, full_name)")
    .eq("organization_id", organizationId)
    .eq("id", routeId)
    .maybeSingle()
    .returns<RouteWithRelations | null>();

  if (error) throw error;
  return data;
}

export async function getRouteWaypoints(organizationId: string, routeId: string): Promise<RouteWaypoint[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("route_waypoints")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("route_id", routeId)
    .order("sequence", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getRouteActivity(organizationId: string, routeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("entity_type", "route")
    .eq("entity_id", routeId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  return data ?? [];
}

export async function listAvailableTrucksForRoute(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trucks")
    .select("id, unit_number, name, status")
    .eq("organization_id", organizationId)
    .neq("status", "maintenance")
    .order("unit_number", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function listAvailableDriversForRoute(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drivers")
    .select("id, full_name, status")
    .eq("organization_id", organizationId)
    .neq("status", "suspended")
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
