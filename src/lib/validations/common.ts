import { z } from "zod";

export const latitudeSchema = z
  .number()
  .min(-90, "Latitud fuera de rango")
  .max(90, "Latitud fuera de rango");

export const longitudeSchema = z
  .number()
  .min(-180, "Longitud fuera de rango")
  .max(180, "Longitud fuera de rango");

export const uuidSchema = z.string().uuid("Identificador inválido");

/** Coordenadas dentro del territorio aproximado de México. */
export const mexicoLatitude = z.number().min(14).max(33);
export const mexicoLongitude = z.number().min(-119).max(-86);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;
