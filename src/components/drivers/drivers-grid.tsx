"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus } from "lucide-react";
import { DriverCard } from "./driver-card";
import { FilterBar } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { Driver, DriverStatus } from "@/types/domain";

export function DriversGrid({
  drivers,
  assignments,
}: {
  drivers: Driver[];
  assignments: Record<string, string>;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<DriverStatus | "all">("all");
  const debouncedSearch = useDebouncedValue(search, 250);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return drivers.filter((d) => {
      if (status !== "all" && d.status !== status) return false;
      if (!q) return true;
      return d.full_name.toLowerCase().includes(q) || (d.license_number ?? "").toLowerCase().includes(q);
    });
  }, [drivers, debouncedSearch, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Buscar por nombre o licencia…">
          <Select value={status} onValueChange={(v) => setStatus(v as DriverStatus | "all")}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="available">Disponible</SelectItem>
              <SelectItem value="assigned">Asignado</SelectItem>
              <SelectItem value="off_duty">Fuera de turno</SelectItem>
              <SelectItem value="suspended">Suspendido</SelectItem>
            </SelectContent>
          </Select>
        </FilterBar>
        <PermissionGuard permission="drivers:write">
          <Button onClick={() => router.push("/conductores/nuevo")}>
            <Plus className="size-4" /> Nuevo conductor
          </Button>
        </PermissionGuard>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={drivers.length === 0 ? "Aún no hay conductores" : "Sin resultados"}
          description={
            drivers.length === 0
              ? "Registra a tu primer conductor para asignarlo a una unidad."
              : "Ajusta los filtros de búsqueda."
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((d) => (
            <DriverCard key={d.id} driver={d} assignedUnit={assignments[d.id]} />
          ))}
        </div>
      )}
    </div>
  );
}
