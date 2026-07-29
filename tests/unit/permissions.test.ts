import { describe, it, expect } from "vitest";
import { can, roleAtLeast, roleRank, assertCan, PermissionError } from "@/lib/permissions";

describe("roleRank / roleAtLeast", () => {
  it("owner tiene el rango más alto", () => {
    expect(roleRank("owner")).toBeGreaterThan(roleRank("admin"));
    expect(roleRank("admin")).toBeGreaterThan(roleRank("dispatcher"));
    expect(roleRank("dispatcher")).toBeGreaterThan(roleRank("operator"));
    expect(roleRank("operator")).toBeGreaterThan(roleRank("viewer"));
  });

  it("roleAtLeast compara jerarquías correctamente", () => {
    expect(roleAtLeast("owner", "admin")).toBe(true);
    expect(roleAtLeast("viewer", "admin")).toBe(false);
    expect(roleAtLeast("admin", "admin")).toBe(true);
  });
});

describe("can", () => {
  it("viewer solo puede leer, no escribir", () => {
    expect(can("viewer", "fleet:read")).toBe(true);
    expect(can("viewer", "fleet:write")).toBe(false);
    expect(can("viewer", "routes:write")).toBe(false);
    expect(can("viewer", "alerts:acknowledge")).toBe(false);
  });

  it("operator puede reconocer y resolver alertas pero no gestionar miembros", () => {
    expect(can("operator", "alerts:acknowledge")).toBe(true);
    expect(can("operator", "alerts:resolve")).toBe(true);
    expect(can("operator", "members:manage")).toBe(false);
    expect(can("operator", "routes:write")).toBe(false);
  });

  it("dispatcher puede gestionar rutas pero no eliminar unidades", () => {
    expect(can("dispatcher", "routes:write")).toBe(true);
    expect(can("dispatcher", "routes:manage")).toBe(true);
    expect(can("dispatcher", "fleet:delete")).toBe(false);
  });

  it("admin puede eliminar unidades y gestionar miembros", () => {
    expect(can("admin", "fleet:delete")).toBe(true);
    expect(can("admin", "members:manage")).toBe(true);
  });

  it("owner tiene todos los permisos", () => {
    expect(can("owner", "fleet:delete")).toBe(true);
    expect(can("owner", "members:manage")).toBe(true);
    expect(can("owner", "settings:write")).toBe(true);
    expect(can("owner", "apikeys:manage")).toBe(true);
  });

  it("devuelve false para rol nulo o indefinido", () => {
    expect(can(null, "fleet:read")).toBe(false);
    expect(can(undefined, "fleet:read")).toBe(false);
  });
});

describe("assertCan", () => {
  it("no lanza cuando el rol tiene el permiso", () => {
    expect(() => assertCan("owner", "fleet:delete")).not.toThrow();
  });

  it("lanza PermissionError cuando el rol no tiene el permiso", () => {
    expect(() => assertCan("viewer", "fleet:write")).toThrow(PermissionError);
  });
});
