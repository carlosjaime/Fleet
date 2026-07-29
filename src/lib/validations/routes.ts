import { z } from "zod";
import { latitudeSchema, longitudeSchema } from "./common";

export const routePrioritySchema = z.enum(["low", "normal", "high", "urgent"]);

export const waypointInputSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(120),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  sequence: z.number().int().min(0),
});

export const routeSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(120),
  reference: z.string().max(60).optional().or(z.literal("")),
  origin_name: z.string().min(1, "Origen requerido").max(160),
  origin_latitude: latitudeSchema,
  origin_longitude: longitudeSchema,
  destination_name: z.string().min(1, "Destino requerido").max(160),
  destination_latitude: latitudeSchema,
  destination_longitude: longitudeSchema,
  truck_id: z.string().uuid().nullable().optional(),
  driver_id: z.string().uuid().nullable().optional(),
  priority: routePrioritySchema.default("normal"),
  scheduled_start_at: z.string().optional().or(z.literal("")),
  scheduled_end_at: z.string().optional().or(z.literal("")),
  estimated_distance_km: z.number().min(0).max(20_000).optional(),
  estimated_duration_minutes: z.number().int().min(0).max(100_000).optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
  waypoints: z.array(waypointInputSchema).max(50).optional(),
});

export type RouteInput = z.infer<typeof routeSchema>;

export const routeActionSchema = z.object({
  action: z.enum(["schedule", "start", "pause", "resume", "complete", "cancel"]),
});
