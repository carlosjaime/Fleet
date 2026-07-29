import { Truck } from "lucide-react";
import { publicEnv } from "@/config/env";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Panel de marca (oculto en móvil) */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-surface p-10 lg:flex">
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div className="relative flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-amber text-background">
            <Truck className="size-5" />
          </span>
          <span className="text-lg font-semibold">{publicEnv.NEXT_PUBLIC_APP_NAME}</span>
        </div>
        <div className="relative space-y-4">
          <h2 className="text-2xl font-semibold leading-tight">
            Centro de control logístico para tu flotilla
          </h2>
          <p className="max-w-md text-sm text-muted">
            Monitoreo GPS en tiempo real, alertas operativas, rutas, mantenimiento y combustible.
            Diseñado para empresas de transporte y última milla en Latinoamérica.
          </p>
          <ul className="grid gap-2 text-sm text-muted">
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-cyan" /> Telemetría y alertas en vivo
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-amber" /> Multiempresa con roles y permisos
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-success" /> Rutas, combustible y mantenimiento
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-muted">© {new Date().getFullYear()} FleetOps</p>
      </div>

      {/* Panel de formulario */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
