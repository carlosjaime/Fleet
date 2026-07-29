/**
 * Utilidades de formato para es-MX (moneda MXN, sistema métrico, fechas).
 */

const currencyFmt = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const numberFmt = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 });
const integerFmt = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 });

/** Importe en pesos mexicanos. */
export function formatCurrency(amount: number, currency = "MXN"): string {
  if (currency === "MXN") return currencyFmt.format(amount);
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(amount);
}

export function formatNumber(value: number): string {
  return numberFmt.format(value);
}

export function formatInteger(value: number): string {
  return integerFmt.format(value);
}

export function formatKm(value: number): string {
  return `${numberFmt.format(value)} km`;
}

export function formatSpeed(value: number): string {
  return `${integerFmt.format(value)} km/h`;
}

export function formatLiters(value: number): string {
  return `${numberFmt.format(value)} L`;
}

export function formatPercent(value: number): string {
  return `${integerFmt.format(value)}%`;
}

/** Coordenada con 5 decimales, estilo telemetría. */
export function formatCoordinate(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

/**
 * Fecha/hora en la zona horaria de la organización.
 */
export function formatDateTime(
  value: string | Date | null | undefined,
  timezone = "America/Mexico_City",
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(date);
}

export function formatDate(
  value: string | Date | null | undefined,
  timezone = "America/Mexico_City",
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeZone: timezone,
  }).format(date);
}

/** Tiempo relativo legible (hace 5 min, en 2 h). */
export function formatRelativeTime(value: string | Date | null | undefined, now = new Date()): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = date.getTime() - now.getTime();
  const rtf = new Intl.RelativeTimeFormat("es-MX", { numeric: "auto" });
  const abs = Math.abs(diffMs);
  const minutes = Math.round(diffMs / 60_000);
  const hours = Math.round(diffMs / 3_600_000);
  const days = Math.round(diffMs / 86_400_000);
  if (abs < 60_000) return "hace un momento";
  if (abs < 3_600_000) return rtf.format(minutes, "minute");
  if (abs < 86_400_000) return rtf.format(hours, "hour");
  return rtf.format(days, "day");
}
