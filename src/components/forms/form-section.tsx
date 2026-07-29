import { cn } from "@/lib/utils/cn";

/**
 * Agrupa campos relacionados dentro de un formulario largo con un título
 * visible (a diferencia de un `<fieldset><legend>` cuya leyenda es
 * pequeña y fácil de pasar por alto). Ayuda a escanear formularios de
 * 10+ campos como los de unidades, conductores y rutas.
 */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4 border-t border-border pt-5 first:border-t-0 first:pt-0", className)}>
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/**
 * Barra de acciones que se queda pegada al fondo del viewport al hacer
 * scroll en formularios largos (rutas con waypoints, unidades con muchos
 * campos), para no tener que volver a bajar a buscar "Guardar".
 */
export function FormActionsBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mb-6 flex items-center gap-2 border-t border-border bg-background/95 py-3 backdrop-blur">
      {children}
    </div>
  );
}
