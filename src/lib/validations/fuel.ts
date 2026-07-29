import { z } from "zod";

export const fuelLogSchema = z.object({
  truck_id: z.string().uuid("Selecciona una unidad"),
  driver_id: z.string().uuid().nullable().optional(),
  liters: z.number().positive("Los litros deben ser mayores a 0").max(5000),
  price_per_liter: z.number().positive("El precio debe ser mayor a 0").max(1000),
  odometer_km: z.number().min(0).max(10_000_000).optional(),
  fuel_station: z.string().max(120).optional().or(z.literal("")),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  recorded_at: z.string().optional().or(z.literal("")),
});

export type FuelLogInput = z.infer<typeof fuelLogSchema>;
