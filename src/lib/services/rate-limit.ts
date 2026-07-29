import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerEnv } from "@/config/env";

/**
 * Rate limiting para el endpoint de ingestión de telemetría.
 *
 * En un entorno serverless (Vercel) no hay estado en memoria persistente
 * entre invocaciones, así que en lugar de un contador local usamos una
 * consulta a `truck_locations` para contar cuántos registros ha insertado
 * esta unidad en la ventana de tiempo configurada. Es una aproximación
 * razonable sin depender de infraestructura adicional (Redis, etc.).
 */
export async function checkTelemetryRateLimit(
  organizationId: string,
  truckId: string,
): Promise<{ allowed: boolean; count: number; limit: number }> {
  const { TELEMETRY_RATE_LIMIT_MAX, TELEMETRY_RATE_LIMIT_WINDOW_SECONDS } = getServerEnv();
  const windowStart = new Date(Date.now() - TELEMETRY_RATE_LIMIT_WINDOW_SECONDS * 1000).toISOString();

  const admin = createAdminClient();
  const { count, error } = await admin
    .from("truck_locations")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("truck_id", truckId)
    .gte("created_at", windowStart);

  if (error) {
    // Ante un error de conteo, no bloqueamos la ingestión (fail-open) pero
    // se registra para observabilidad.
    console.error("[rate-limit] fallo al contar registros", error.message);
    return { allowed: true, count: 0, limit: TELEMETRY_RATE_LIMIT_MAX };
  }

  const current = count ?? 0;
  return { allowed: current < TELEMETRY_RATE_LIMIT_MAX, count: current, limit: TELEMETRY_RATE_LIMIT_MAX };
}
