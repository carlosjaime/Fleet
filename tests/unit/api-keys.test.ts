import { describe, it, expect } from "vitest";
import { generateApiKey, hashApiKey, verifyApiKey, timingSafeEqual } from "@/lib/auth/api-keys";

describe("generateApiKey", () => {
  it("genera una clave con el prefijo esperado", async () => {
    const key = await generateApiKey();
    expect(key.plainKey.startsWith("fops_")).toBe(true);
    expect(key.keyPrefix.startsWith("fops_")).toBe(true);
  });

  it("genera claves distintas en cada llamada", async () => {
    const a = await generateApiKey();
    const b = await generateApiKey();
    expect(a.plainKey).not.toBe(b.plainKey);
  });

  it("el hash corresponde a la clave generada", async () => {
    const key = await generateApiKey();
    const verified = await verifyApiKey(key.plainKey, key.keyHash);
    expect(verified).toBe(true);
  });
});

describe("hashApiKey", () => {
  it("produce un hash hexadecimal de 64 caracteres (SHA-256)", async () => {
    const hash = await hashApiKey("test-key-123");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("es determinista para la misma entrada", async () => {
    const a = await hashApiKey("same-input");
    const b = await hashApiKey("same-input");
    expect(a).toBe(b);
  });
});

describe("verifyApiKey", () => {
  it("rechaza una clave incorrecta", async () => {
    const key = await generateApiKey();
    const verified = await verifyApiKey("clave-incorrecta", key.keyHash);
    expect(verified).toBe(false);
  });
});

describe("timingSafeEqual", () => {
  it("devuelve true para cadenas idénticas", () => {
    expect(timingSafeEqual("abc123", "abc123")).toBe(true);
  });
  it("devuelve false para cadenas distintas de igual longitud", () => {
    expect(timingSafeEqual("abc123", "abc124")).toBe(false);
  });
  it("devuelve false para longitudes distintas", () => {
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
  });
});
