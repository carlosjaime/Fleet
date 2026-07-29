import { z } from "zod";
import { ORG_ROLES } from "@/lib/permissions";

export const orgSettingsSchema = z.object({
  speed_limit_kmh: z.number().int().min(10).max(200),
  low_fuel_threshold_pct: z.number().int().min(1).max(90),
  route_deviation_tolerance_meters: z.number().int().min(50).max(50_000),
  delay_tolerance_minutes: z.number().int().min(1).max(1440),
  gps_offline_minutes: z.number().int().min(1).max(1440),
  metric_units: z.boolean(),
  currency: z.string().min(3).max(3),
});

export const organizationSchema = z.object({
  name: z.string().min(2, "Nombre requerido").max(120),
  country: z.string().max(60).optional(),
  timezone: z.string().max(60).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Correo inválido"),
  role: z.enum(ORG_ROLES as unknown as [string, ...string[]]),
});

export const changeMemberRoleSchema = z.object({
  member_id: z.string().uuid(),
  role: z.enum(ORG_ROLES as unknown as [string, ...string[]]),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(120),
  truck_id: z.string().uuid().nullable().optional(),
  expires_at: z.string().optional().or(z.literal("")),
});

export type OrgSettingsInput = z.infer<typeof orgSettingsSchema>;
export type OrganizationInput = z.infer<typeof organizationSchema>;
