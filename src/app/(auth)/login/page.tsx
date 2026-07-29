import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/forms/login-form";
import { isDemoMode } from "@/config/env";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
        <p className="text-sm text-muted">Accede al centro de control de tu flotilla.</p>
      </div>

      {isDemoMode() ? (
        <div className="rounded-[var(--radius)] border border-cyan/30 bg-cyan/5 p-3 text-xs">
          <p className="font-medium text-cyan">Credenciales demo</p>
          <p className="telemetry mt-1 text-muted">admin@fleetops.demo · FleetOps2026!</p>
        </div>
      ) : null}

      <LoginForm redirectTo={redirect} />

      <div className="flex items-center justify-between text-sm">
        <Link href="/recuperar-contrasena" className="text-cyan hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
        <Link href="/registro" className="text-muted hover:text-foreground">
          Crear cuenta
        </Link>
      </div>
    </div>
  );
}
