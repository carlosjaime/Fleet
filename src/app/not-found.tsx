import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="telemetry text-5xl font-semibold text-amber">404</p>
      <h1 className="text-xl font-semibold">Página no encontrada</h1>
      <p className="text-sm text-muted">La ruta que buscas no existe o fue movida.</p>
      <Button asChild variant="outline"><Link href="/dashboard">Ir al dashboard</Link></Button>
    </div>
  );
}
