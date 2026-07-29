"use client";

import { Search } from "lucide-react";
import { Input } from "./input";
import { cn } from "@/lib/utils/cn";

export function FilterBar({
  children,
  search,
  onSearchChange,
  searchPlaceholder = "Buscar…",
  className,
}: {
  children?: React.ReactNode;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {onSearchChange ? (
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8"
          />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
