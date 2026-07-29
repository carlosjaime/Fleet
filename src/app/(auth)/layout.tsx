import { BrandLogo } from "@/components/brand/logo";
import { DevHiveCredit } from "@/components/brand/devhive-credit";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Panel de marca (oculto en móvil) */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-surface p-10 lg:flex">
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div className="relative">
          <BrandLogo size={36} textClassName="text-lg" />
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
        <div className="relative flex items-center justify-between gap-3">
          <p className="text-xs text-muted">© {new Date().getFullYear()} FleetOps</p>
          <DevHiveCredit />
        </div>
      </div>

      {/* Panel de formulario */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
