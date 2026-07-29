"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

const DEVHIVE_LOGO_URL = "https://i.ibb.co/hR4W8tnY/devhive-512.png";

/**
 * Crédito del desarrollador de la plataforma. Usa un <img> plano (no
 * next/image) a propósito: el logo se referencia desde un host externo
 * (ImgBB) que en pruebas server-side devolvió 403 a solicitudes sin
 * contexto de navegador, así que se evita el pipeline de optimización de
 * imágenes de Next.js (que haría el fetch desde el servidor) y se deja
 * que el propio navegador del usuario cargue la imagen directamente.
 *
 * Si la imagen no carga (host externo caído, hotlinking bloqueado, etc.)
 * se usa un placeholder con la inicial en vez de dejar el ícono roto del
 * navegador desbordarse sobre el texto.
 */
function DevHiveMark({ size, rounded = "rounded-md" }: { size: number; rounded?: string }) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <span
        className={cn("flex shrink-0 items-center justify-center bg-surface-elevated font-brand font-bold text-muted", rounded)}
        style={{ width: size, height: size, fontSize: size * 0.5 }}
        aria-hidden
      >
        D
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- ver comentario del módulo
    <img
      src={DEVHIVE_LOGO_URL}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 object-cover", rounded)}
      style={{ width: size, height: size }}
      onError={() => setErrored(true)}
    />
  );
}

export function DevHiveCredit({
  size = 20,
  variant = "compact",
  className,
}: {
  size?: number;
  variant?: "compact" | "full";
  className?: string;
}) {
  const year = new Date().getFullYear();

  if (variant === "compact") {
    return (
      <p className={cn("flex items-center gap-1.5 text-xs text-muted", className)}>
        <DevHiveMark size={size} rounded="rounded-sm" />
        Desarrollado por <span className="font-medium text-muted">DevHive Software</span>
      </p>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <DevHiveMark size={size} />
      <div>
        <p className="text-sm font-semibold text-foreground">DevHive Software</p>
        <p className="text-xs text-muted">© {year} DevHive Software. Todos los derechos reservados.</p>
      </div>
    </div>
  );
}
