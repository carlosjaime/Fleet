/**
 * Acceso centralizado y validado a variables de entorno.
 *
 * - Las variables públicas (NEXT_PUBLIC_*) pueden leerse en cliente y servidor.
 * - Las variables privadas SOLO deben leerse desde el servidor. Acceder a
 *   `serverEnv` desde un Client Component provoca un error en build/runtime,
 *   lo cual es intencional para evitar filtrar secretos.
 */
import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("FleetOps"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_DEMO_MODE: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  NEXT_PUBLIC_ENABLE_GPS_SIMULATOR: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

// Referencia explícita: Next.js reemplaza estas expresiones en build.
export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
  NEXT_PUBLIC_ENABLE_GPS_SIMULATOR: process.env.NEXT_PUBLIC_ENABLE_GPS_SIMULATOR,
});

export function isDemoMode(): boolean {
  return publicEnv.NEXT_PUBLIC_DEMO_MODE === true;
}

export function isGpsSimulatorEnabled(): boolean {
  return publicEnv.NEXT_PUBLIC_ENABLE_GPS_SIMULATOR === true;
}

/**
 * Lee variables de entorno privadas. Lanza si se invoca en el navegador.
 */
export function getServerEnv() {
  if (typeof window !== "undefined") {
    throw new Error("getServerEnv() no puede ejecutarse en el navegador.");
  }
  return {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    SIMULATOR_SECRET: process.env.SIMULATOR_SECRET ?? "",
    TELEMETRY_RATE_LIMIT_MAX: Number(process.env.TELEMETRY_RATE_LIMIT_MAX ?? "120"),
    TELEMETRY_RATE_LIMIT_WINDOW_SECONDS: Number(
      process.env.TELEMETRY_RATE_LIMIT_WINDOW_SECONDS ?? "60",
    ),
    NODE_ENV: process.env.NODE_ENV ?? "development",
  };
}

export function isSupabaseConfigured(): boolean {
  return Boolean(publicEnv.NEXT_PUBLIC_SUPABASE_URL && publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
