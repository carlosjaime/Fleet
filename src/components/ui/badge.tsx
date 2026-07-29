import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-border bg-surface-elevated text-foreground",
        success: "border-success/30 bg-success/10 text-success",
        warning: "border-amber/30 bg-amber/10 text-amber",
        critical: "border-critical/30 bg-critical/10 text-critical",
        info: "border-info/30 bg-info/10 text-info",
        cyan: "border-cyan/30 bg-cyan/10 text-cyan",
        muted: "border-border bg-transparent text-muted",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
export { Badge, badgeVariants };
