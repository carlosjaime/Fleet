"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { NAV_ITEMS } from "@/config/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

/** Buscador global de secciones. Se abre con Ctrl/Cmd+K. */
export function CommandSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = NAV_ITEMS.filter((i) =>
    i.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex h-9 w-full max-w-xs items-center gap-2 rounded-[var(--radius)] border border-border bg-surface px-3 text-sm text-muted transition-colors hover:border-cyan/40"
          aria-label="Buscar"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Buscar…</span>
          <kbd className="telemetry hidden rounded border border-border px-1.5 text-[10px] sm:inline">
            ⌘K
          </kbd>
        </button>
      </DialogTrigger>
      <DialogContent className="top-[20%] max-w-md translate-y-0">
        <DialogHeader>
          <DialogTitle className="sr-only">Buscar en FleetOps</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          placeholder="Buscar secciones…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ul className="max-h-72 space-y-1 overflow-y-auto">
          {results.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <button
                  className="flex w-full items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm hover:bg-surface-elevated"
                  onClick={() => {
                    setOpen(false);
                    router.push(item.href);
                  }}
                >
                  <Icon className="size-4 text-muted" />
                  {item.label}
                </button>
              </li>
            );
          })}
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted">Sin resultados</li>
          ) : null}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
