import { describe, it, expect } from "vitest";
import { safeRedirectPath } from "@/lib/supabase/middleware";

describe("safeRedirectPath", () => {
  it("permite rutas internas relativas", () => {
    expect(safeRedirectPath("/flota")).toBe("/flota");
    expect(safeRedirectPath("/rutas/123")).toBe("/rutas/123");
  });

  it("usa el valor por defecto si no se proporciona destino", () => {
    expect(safeRedirectPath(null)).toBe("/dashboard");
    expect(safeRedirectPath(undefined)).toBe("/dashboard");
    expect(safeRedirectPath("")).toBe("/dashboard");
  });

  it("bloquea redirecciones abiertas a otros hosts (protocolo-relativo //)", () => {
    expect(safeRedirectPath("//evil.com")).toBe("/dashboard");
  });

  it("bloquea URLs absolutas externas", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("http://evil.com/phish")).toBe("/dashboard");
  });

  it("bloquea rutas que no empiezan con /", () => {
    expect(safeRedirectPath("evil.com")).toBe("/dashboard");
  });

  it("respeta un fallback personalizado", () => {
    expect(safeRedirectPath(null, "/login")).toBe("/login");
  });
});
