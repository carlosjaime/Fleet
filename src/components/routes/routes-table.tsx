"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Route as RouteIcon, Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { RouteStatusBadge } from "@/components/ui/status-badges";
import { Badge } from "@/components/ui/badge";
import { FilterBar } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatDateTime, formatPercent } from "@/lib/utils/format";
import type { RouteStatus } from "@/types/domain";
import type { RouteWithRelations } from "@/features/routes/queries";

const STATUS_OPTIONS: { value: RouteStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos los estados" },
  { value: "draft", label: "Borrador" },
  { value: "scheduled", label: "Programada" },
  { value: "in_progress", label: "En progreso" },
  { value: "paused", label: "Pausada" },
  { value: "completed", label: "Completada" },
  { value: "cancelled", label: "Cancelada" },
];

export function RoutesTable({ routes }: { routes: RouteWithRelations[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RouteStatus | "all">("all");
  const debouncedSearch = useDebouncedValue(search, 250);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return routes.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.origin_name.toLowerCase().includes(q) ||
        r.destination_name.toLowerCase().includes(q)
      );
    });
  }, [routes, debouncedSearch, status]);

  const columns: ColumnDef<RouteWithRelations, unknown>[] = [
    {
      accessorKey: "name",
      header: "Ruta",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted">
            {row.original.origin_name} → {row.original.destination_name}
          </p>
        </div>
      ),
    },
    { accessorKey: "status", header: "Estado", cell: ({ row }) => <RouteStatusBadge status={row.original.status} /> },
    {
      id: "truck",
      header: "Unidad",
      cell: ({ row }) => row.original.truck?.unit_number ?? <span className="text-muted">Sin asignar</span>,
    },
    {
      id: "driver",
      header: "Conductor",
      cell: ({ row }) => row.original.driver?.full_name ?? <span className="text-muted">Sin asignar</span>,
    },
    {
      accessorKey: "priority",
      header: "Prioridad",
      cell: ({ row }) => <Badge variant="muted">{row.original.priority}</Badge>,
    },
    {
      accessorKey: "progress_pct",
      header: "Progreso",
      cell: ({ row }) => formatPercent(row.original.progress_pct),
    },
    {
      accessorKey: "scheduled_start_at",
      header: "Programada",
      cell: ({ row }) => formatDateTime(row.original.scheduled_start_at),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Buscar por nombre, origen o destino…">
          <Select value={status} onValueChange={(v) => setStatus(v as RouteStatus | "all")}>
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
        <PermissionGuard permission="routes:write">
          <Button onClick={() => router.push("/rutas/nuevo")}>
            <Plus className="size-4" /> Nueva ruta
          </Button>
        </PermissionGuard>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        getRowId={(r) => r.id}
        onRowClick={(r) => router.push(`/rutas/${r.id}`)}
        emptyState={
          <EmptyState
            icon={RouteIcon}
            title={routes.length === 0 ? "Aún no hay rutas" : "Sin resultados"}
            description={
              routes.length === 0 ? "Crea tu primera ruta para asignar unidades y conductores." : "Ajusta los filtros."
            }
          />
        }
      />
    </div>
  );
}
