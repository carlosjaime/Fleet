"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Truck as TruckIcon, Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { TruckStatusBadge, DriverStatusBadge } from "@/components/ui/status-badges";
import { FilterBar } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatSpeed, formatPercent, formatRelativeTime, formatKm } from "@/lib/utils/format";
import type { TruckStatus, TruckWithDriver } from "@/types/domain";

const STATUS_OPTIONS: { value: TruckStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos los estados" },
  { value: "active", label: "Activo" },
  { value: "idle", label: "Inactivo" },
  { value: "maintenance", label: "Mantenimiento" },
  { value: "offline", label: "Sin señal" },
];

export function TrucksTable({ trucks }: { trucks: TruckWithDriver[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TruckStatus | "all">("all");
  const debouncedSearch = useDebouncedValue(search, 250);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return trucks.filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.unit_number.toLowerCase().includes(q) ||
        t.plate.toLowerCase().includes(q)
      );
    });
  }, [trucks, debouncedSearch, status]);

  const columns: ColumnDef<TruckWithDriver, unknown>[] = [
    {
      accessorKey: "unit_number",
      header: "Unidad",
      cell: ({ row }) => (
        <div>
          <p className="telemetry font-medium">{row.original.unit_number}</p>
          <p className="text-xs text-muted">{row.original.name}</p>
        </div>
      ),
    },
    { accessorKey: "plate", header: "Placa", cell: ({ row }) => <span className="telemetry">{row.original.plate}</span> },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => <TruckStatusBadge status={row.original.status} />,
    },
    {
      id: "driver",
      header: "Conductor",
      cell: ({ row }) =>
        row.original.driver ? (
          <div className="flex items-center gap-2">
            <span>{row.original.driver.full_name}</span>
            <DriverStatusBadge status={row.original.driver.status} />
          </div>
        ) : (
          <span className="text-muted">Sin asignar</span>
        ),
    },
    {
      accessorKey: "last_speed_kmh",
      header: "Velocidad",
      cell: ({ row }) => (row.original.last_speed_kmh != null ? formatSpeed(row.original.last_speed_kmh) : "—"),
    },
    {
      accessorKey: "current_fuel_pct",
      header: "Combustible",
      cell: ({ row }) => (row.original.current_fuel_pct != null ? formatPercent(row.original.current_fuel_pct) : "—"),
    },
    {
      accessorKey: "odometer_km",
      header: "Odómetro",
      cell: ({ row }) => formatKm(row.original.odometer_km),
    },
    {
      accessorKey: "last_location_at",
      header: "Últ. actualización",
      cell: ({ row }) => formatRelativeTime(row.original.last_location_at),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Buscar por unidad, nombre o placa…">
          <Select value={status} onValueChange={(v) => setStatus(v as TruckStatus | "all")}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterBar>
        <PermissionGuard permission="fleet:write">
          <Button onClick={() => router.push("/flota/nuevo")}>
            <Plus className="size-4" /> Nueva unidad
          </Button>
        </PermissionGuard>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        getRowId={(t) => t.id}
        onRowClick={(t) => router.push(`/flota/${t.id}`)}
        emptyState={
          <EmptyState
            icon={TruckIcon}
            title={trucks.length === 0 ? "Aún no hay unidades" : "Sin resultados"}
            description={
              trucks.length === 0
                ? "Registra tu primera unidad para comenzar a monitorear tu flotilla."
                : "Ajusta los filtros de búsqueda."
            }
            action={
              trucks.length === 0 ? (
                <PermissionGuard permission="fleet:write">
                  <Button onClick={() => router.push("/flota/nuevo")}>
                    <Plus className="size-4" /> Nueva unidad
                  </Button>
                </PermissionGuard>
              ) : undefined
            }
          />
        }
      />
    </div>
  );
}
