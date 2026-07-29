import type { Metadata } from "next";
import Link from "next/link";
import { Radar, ShieldCheck, Route as RouteIcon, Wrench } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { DevHiveCredit } from "@/components/brand/devhive-credit";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Acerca de" };

const FEATURES = [
  { icon: Radar, label: "Telemetría GPS en tiempo real" },
  { icon: ShieldCheck, label: "Alertas operativas automáticas" },
  { icon: RouteIcon, label: "Gestión de rutas y despacho" },
  { icon: Wrench, label: "Mantenimiento y combustible" },
];

export default function AcercaDePage() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-30" aria-hidden />

      <header className="relative mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <BrandLogo size={32} textClassName="text-base" />
        <Button asChild variant="outline" size="sm">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </header>

      <section className="relative mx-auto max-w-3xl px-6 pb-24 pt-8">
        <p className="telemetry text-xs uppercase tracking-widest text-cyan">Acerca de</p>
        <h1 className="font-brand mt-3 text-3xl font-bold leading-tight sm:text-4xl">FleetOps</h1>
        <p className="mt-4 max-w-xl text-base text-muted">
          Centro de control operativo para flotillas de transporte, logística, distribución y
          última milla en Latinoamérica. Monitoreo GPS en tiempo real, alertas automáticas,
          rutas, mantenimiento y combustible — con seguridad multiempresa real, en un solo
          tablero.
        </p>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FEATURES.map((f) => (
            <li
              key={f.label}
              className="flex flex-col items-start gap-2 rounded-[var(--radius)] border border-border bg-surface p-4"
            >
              <f.icon className="size-5 text-amber" />
              <span className="text-xs text-muted">{f.label}</span>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-[var(--radius)] border border-border bg-surface p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">
            Desarrollado por
          </p>
          <DevHiveCredit variant="full" size={48} />
        </div>

        <p className="mt-8 text-xs text-muted">
          © {new Date().getFullYear()} FleetOps. Todos los derechos reservados.
        </p>
      </section>
    </main>
  );
}
