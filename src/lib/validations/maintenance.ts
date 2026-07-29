import { z } from "zod";

export const maintenanceTypeSchema = z.enum(["preventive", "corrective", "inspection"]);
export const maintenanceStatusSchema = z.enum([
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
  "overdue",
]);

export const maintenanceSchema = z.object({
  truck_id: z.string().uuid("Selecciona una unidad"),
  type: maintenanceTypeSchema,
  description: z.string().max(500).optional().or(z.literal("")),
  status: maintenanceStatusSchema,
  scheduled_at: z.string().optional().or(z.literal("")),
  completed_at: z.string().optional().or(z.literal("")),
  odometer_at_service: z.number().min(0).max(10_000_000).optional(),
  next_service_odometer: z.number().min(0).max(10_000_000).optional(),
  next_service_date: z.string().optional().or(z.literal("")),
  cost: z.number().min(0).max(10_000_000).optional(),
  provider: z.string().max(120).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type MaintenanceInput = z.infer<typeof maintenanceSchema>;
