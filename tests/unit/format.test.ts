import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatNumber,
  formatKm,
  formatSpeed,
  formatPercent,
  formatCoordinate,
  formatDate,
  formatDateTime,
  formatRelativeTime,
} from "@/lib/utils/format";

describe("formatCurrency", () => {
  it("formatea en pesos mexicanos por defecto", () => {
    const result = formatCurrency(1234.5);
    expect(result).toContain("1,234.50");
    expect(result).toMatch(/\$/);
  });

  it("redondea a dos decimales", () => {
    expect(formatCurrency(10)).toContain("10.00");
  });
});

describe("formatNumber / formatKm / formatSpeed / formatPercent", () => {
  it("formatKm agrega la unidad km", () => {
    expect(formatKm(150.456)).toBe("150.5 km");
  });
  it("formatSpeed agrega la unidad km/h y redondea", () => {
    expect(formatSpeed(89.6)).toBe("90 km/h");
  });
  it("formatPercent agrega el símbolo % y redondea", () => {
    expect(formatPercent(65.4)).toBe("65%");
  });
  it("formatNumber usa separador de miles es-MX", () => {
    expect(formatNumber(1234.5)).toBe("1,234.5");
  });
});

describe("formatCoordinate", () => {
  it("formatea con 5 decimales separados por coma", () => {
    expect(formatCoordinate(19.432608, -99.133209)).toBe("19.43261, -99.13321");
  });
});

describe("formatDate / formatDateTime", () => {
  it("devuelve — para valores nulos", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDateTime(undefined)).toBe("—");
  });
  it("devuelve — para fechas inválidas", () => {
    expect(formatDate("no-es-fecha")).toBe("—");
  });
  it("formatea una fecha válida sin lanzar", () => {
    expect(formatDate("2026-01-15T10:00:00Z")).not.toBe("—");
    expect(formatDateTime("2026-01-15T10:00:00Z")).not.toBe("—");
  });
});

describe("formatRelativeTime", () => {
  it("devuelve — para valores nulos", () => {
    expect(formatRelativeTime(null)).toBe("—");
  });

  it("devuelve 'hace un momento' para diferencias menores a un minuto", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const recent = new Date("2026-01-01T11:59:35Z");
    expect(formatRelativeTime(recent, now)).toBe("hace un momento");
  });

  it("formatea minutos en el pasado", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const past = new Date("2026-01-01T11:55:00Z");
    const result = formatRelativeTime(past, now);
    expect(result).toMatch(/hace|minuto/);
  });
});
