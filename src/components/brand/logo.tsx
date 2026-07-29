import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/**
 * Isotipo de marca (el ícono "F" solo). El SVG vive en /public/brand y
 * está construido a partir del glifo de Chakra Petch Bold convertido a
 * trazado vectorial — ver public/brand/README.md.
 */
export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/isotipo.svg"
      alt=""
      width={size}
      height={size}
      priority
      className={cn("rounded-[22%]", className)}
    />
  );
}

/** Logotipo completo: isotipo + wordmark "FleetOps" en la fuente de marca. */
export function BrandLogo({
  size = 32,
  textClassName,
  className,
}: {
  size?: number;
  textClassName?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <BrandMark size={size} />
      <span className={cn("font-brand font-bold tracking-tight text-foreground", textClassName)}>
        FleetOps
      </span>
    </span>
  );
}
