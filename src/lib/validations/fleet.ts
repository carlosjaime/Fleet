import { z } from "zod";

const currentYear = new Date().getFullYear();

export const truckStatusSchema = z.enum(["active", "idle", "offline", "maintenance"]);

export const truckSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(120),
  unit_number: z.string().min(1, "El número de unidad es requerido").max(32),
  plate: z.string().min(1, "La placa es requerida").max(20),
  vin: z.string().max(17).optional().or(z.literal("")),
  brand: z.string().max(60).optional().or(z.literal("")),
  model: z.string().max(60).optional().or(z.literal("")),
  year: z
    .number()
    .int()
    .min(1950, "Año inválido")
    .max(currentYear + 1, "Año inválido")
    .optional(),
  color: z.string().max(40).optional().or(z.literal("")),
  vehicle_type: z.string().max(40).optional().or(z.literal("")),
  capacity_kg: z.number().min(0).max(100_000).optional(),
  fuel_type: z.string().max(40).optional().or(z.literal("")),
  fuel_capacity_liters: z.number().min(0).max(5000).optional(),
  current_fuel_pct: z.number().min(0, "Fuera de rango").max(100, "Fuera de rango").optional(),
  odometer_km: z.number().min(0).max(10_000_000),
  status: truckStatusSchema,
});

export type TruckInput = z.infer<typeof truckSchema>;

export const changeTruckStatusSchema = z.object({
  status: truckStatusSchema,
});

export const assignDriverSchema = z.object({
  driver_id: z.string().uuid().nullable(),
});
