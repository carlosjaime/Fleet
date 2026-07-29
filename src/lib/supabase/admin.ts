/**
 * Cliente administrativo de Supabase (Service Role).
 *
 * ⚠️ SOLO SERVIDOR. Omite RLS por completo. Nunca importar desde un Client
 * Component. Usarlo únicamente en endpoints/acciones de servidor que ya
 * validaron autorización, o en tareas de ingestión con API key de dispositivo.
 */
import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { publicEnv, getServerEnv } from "@/config/env";

export function createAdminClient() {
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no está configurada.");
  }
  return createSupabaseClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL ?? "",
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
