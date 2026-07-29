import { ok } from "@/lib/utils/api";
import { isSupabaseConfigured } from "@/config/env";

export const runtime = "nodejs";

export async function GET() {
  return ok({
    status: "ok",
    supabaseConfigured: isSupabaseConfigured(),
    timestamp: new Date().toISOString(),
  });
}
