/**
 * Helpers para respuestas de API consistentes.
 * Formato estándar de éxito y error usado por todos los Route Handlers.
 */
import { NextResponse } from "next/server";

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResult<T> = ApiSuccess<T> | ApiError;

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, init);
}

export function fail(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
): NextResponse<ApiError> {
  const body: ApiError = { success: false, error: { code, message } };
  if (details !== undefined) body.error.details = details;
  return NextResponse.json(body, { status });
}

/** Errores comunes reutilizables. */
export const ApiErrors = {
  unauthorized: () => fail("UNAUTHORIZED", "No autenticado", 401),
  forbidden: () => fail("FORBIDDEN", "Permisos insuficientes", 403),
  notFound: (message = "Recurso no encontrado") => fail("NOT_FOUND", message, 404),
  rateLimited: () => fail("RATE_LIMITED", "Demasiadas solicitudes", 429),
  validation: (details: unknown) =>
    fail("INVALID_INPUT", "Los datos enviados no son válidos", 422, details),
  internal: () => fail("INTERNAL_ERROR", "Error interno del servidor", 500),
} as const;
