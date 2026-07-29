"use client";

/**
 * Cliente de Supabase para el navegador.
 * Usa la anon key (pública). Nunca debe usar la Service Role Key.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import { publicEnv } from "@/config/env";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL ?? "",
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
  return browserClient;
}
