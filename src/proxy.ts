import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas excepto:
     * - _next/static, _next/image
     * - favicon y archivos estáticos comunes
     * - rutas de API de telemetría/simulador (usan su propia autenticación)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/telemetry|api/simulator|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
