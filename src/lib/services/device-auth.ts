import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashApiKey } from "@/lib/auth/api-keys";

export interface DeviceIdentity {
  apiKeyId: string;
  organizationId: string;
  /** Unidad a la que está restringida la clave, si aplica. */
  scopedTruckId: string | null;
}

/**
 * Verifica una API key de dispositivo enviada como Bearer token.
 * Nunca acepta claves por query params. Devuelve null si es inválida,
 * revocada o expirada.
 */
export async function verifyDeviceApiKey(bearerToken: string | null): Promise<DeviceIdentity | null> {
  if (!bearerToken) return null;

  const admin = createAdminClient();
  const keyHash = await hashApiKey(bearerToken);

  const { data, error } = await admin
    .from("device_api_keys")
    .select("id, organization_id, truck_id, status, expires_at")
    .eq("key_hash", keyHash)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) return null;
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) return null;

  // Actualiza last_used_at de forma best-effort (no bloquea la respuesta).
  void admin.from("device_api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);

  return { apiKeyId: data.id, organizationId: data.organization_id, scopedTruckId: data.truck_id };
}

/** Extrae el Bearer token del encabezado Authorization. Nunca lee query params. */
export function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());
  return match?.[1]?.trim() || null;
}
