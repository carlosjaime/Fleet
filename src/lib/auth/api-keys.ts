/**
 * Generación y verificación de API keys de dispositivos.
 *
 * - La clave completa solo se muestra una vez, al crearla.
 * - En la base de datos únicamente se almacena el hash SHA-256 y un prefijo
 *   no sensible para identificarla en la interfaz.
 *
 * Usa la Web Crypto API (disponible en el runtime Node y Edge de Next.js).
 */

const KEY_BYTES = 24; // 24 bytes -> 32 chars base64url aprox.
const PREFIX = "fops_";

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const base64 = typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(bytes).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export interface GeneratedApiKey {
  /** Clave en texto plano. Mostrar una sola vez, nunca persistir. */
  plainKey: string;
  /** Prefijo público para identificarla (p. ej. "fops_ab12cd"). */
  keyPrefix: string;
  /** Hash SHA-256 en hex para almacenar. */
  keyHash: string;
}

/** Genera una nueva API key criptográficamente aleatoria. */
export async function generateApiKey(): Promise<GeneratedApiKey> {
  const random = new Uint8Array(KEY_BYTES);
  crypto.getRandomValues(random);
  const body = toBase64Url(random);
  const plainKey = `${PREFIX}${body}`;
  const keyHash = await hashApiKey(plainKey);
  const keyPrefix = plainKey.slice(0, PREFIX.length + 6);
  return { plainKey, keyPrefix, keyHash };
}

/** Hash SHA-256 (hex) de una clave en texto plano. */
export async function hashApiKey(plainKey: string): Promise<string> {
  const data = new TextEncoder().encode(plainKey);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

/** Comparación en tiempo constante para evitar timing attacks. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Verifica que una clave en texto plano corresponda a un hash almacenado. */
export async function verifyApiKey(plainKey: string, storedHash: string): Promise<boolean> {
  const hash = await hashApiKey(plainKey);
  return timingSafeEqual(hash, storedHash);
}
