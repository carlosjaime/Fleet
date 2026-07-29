import { z } from "zod";

export const driverStatusSchema = z.enum(["available", "assigned", "off_duty", "suspended"]);

export const driverSchema = z.object({
  full_name: z.string().min(2, "El nombre es requerido").max(120),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  phone: z
    .string()
    .max(20)
    .regex(/^[0-9+\-\s()]*$/, "Teléfono inválido")
    .optional()
    .or(z.literal("")),
  license_number: z.string().max(40).optional().or(z.literal("")),
  license_type: z.string().max(20).optional().or(z.literal("")),
  license_expiration: z.string().optional().or(z.literal("")),
  status: driverStatusSchema,
  emergency_contact: z.string().max(120).optional().or(z.literal("")),
});

export type DriverInput = z.infer<typeof driverSchema>;
