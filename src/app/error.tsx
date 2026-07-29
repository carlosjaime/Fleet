"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // En producción, enviar a un servicio de observabilidad.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Algo salió mal</h1>
      <p className="text-sm text-muted">Ocurrió un error inesperado al cargar esta vista.</p>
      <Button variant="outline" onClick={reset}>Reintentar</Button>
    </div>
  );
}
