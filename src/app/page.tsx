import Link from "next/link";
import { Truck, Radar, ShieldCheck, Route as RouteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { publicEnv } from "@/config/env";

export default function LandingPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-30" aria-hidden />
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-amber text-background">
            <Truck className="size-5" />
          </span>
          <span className="text-lg font-semibold">{publicEnv.NEXT_PUBLIC_APP_NAME}</span>
        </div>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm"><Link href="/login">Iniciar sesión</Link></Button>
          <Button asChild variant="primary" size="sm"><Link href="/registro">Crear cuenta</Link></Button>
        </nav>
      </header>

      <section className="relative mx-auto max-w-6xl px-6 pt-16 pb-24">
        <p className="telemetry text-xs uppercase tracking-widest text-cyan">
          Plataforma de monitoreo de flotillas · LATAM
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
          El centro de control operativo para tu flotilla de camiones
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted">
          Telemetría GPS en tiempo real, alertas inteligentes, rutas, mantenimiento y combustible.
          Seguridad multiempresa con roles y permisos. Todo en un solo tablero.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild variant="primary" size="lg"><Link href="/registro">Comenzar ahora</Link></Button>
          <Button asChild variant="outline" size="lg"><Link href="/login">Ver demo</Link></Button>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Radar, title: "Telemetría en vivo", desc: "Posición, velocidad y combustible en tiempo real." },
            { icon: ShieldCheck, title: "Alertas operativas", desc: "Exceso de velocidad, desvíos y combustible bajo." },
            { icon: RouteIcon, title: "Gestión de rutas", desc: "Programa, asigna y sigue el avance de cada ruta." },
            { icon: Truck, title: "Mantenimiento", desc: "Preventivo y correctivo con avisos automáticos." },
          ].map((f) => (
            <div key={f.title} className="rounded-[var(--radius)] border border-border bg-surface p-5">
              <f.icon className="size-5 text-amber" />
              <h3 className="mt-3 text-sm font-semibold">{f.title}</h3>
              <p className="mt-1 text-xs text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
