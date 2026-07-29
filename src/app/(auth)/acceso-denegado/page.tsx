import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { logoutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Acceso denegado" };

const MOTIVOS: Record<string, string> = {
  "sin-organizacion": "Tu cuenta no pertenece a ninguna organización activa.",
  "rol-insuficiente": "Tu rol no tiene permisos para acceder a esta sección.",
};

export default async function AccesoDenegadoPage({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string }>;
}) {
  const { motivo } = await searchParams;
  const mensaje = (motivo && MOTIVOS[motivo]) || "No tienes acceso a este recurso.";
  return (
    <div className="space-y-6 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-critical/10 text-critical">
        <ShieldAlert className="size-6" />
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Acceso denegado</h1>
        <p className="text-sm text-muted">{mensaje}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Button asChild variant="outline">
          <Link href="/dashboard">Ir al dashboard</Link>
        </Button>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" className="w-full">Cerrar sesión</Button>
        </form>
      </div>
    </div>
  );
}
