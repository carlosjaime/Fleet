"use client";

import * as React from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./table";
import { Button } from "./button";
import { LoadingSkeleton } from "./states";
import { cn } from "@/lib/utils/cn";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData) => string;
  /**
   * Color de acento (hex) por fila, mostrado como borde izquierdo en la
   * tabla y como franja en la tarjeta móvil. Da una lectura de estado "de
   * un vistazo" (p. ej. rojo = sin señal) sin depender solo del texto.
   */
  rowAccentColor?: (row: TData) => string | undefined;
  /**
   * Si se provee, en pantallas pequeñas se renderiza esta tarjeta en vez
   * de la tabla (que solo se ve desde `sm:` hacia arriba). Sin esto, las
   * tablas anchas obligan a hacer scroll horizontal en móvil.
   */
  mobileCard?: (row: TData) => React.ReactNode;
  /** Paginación controlada externamente (server-side). */
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<TData>({
  columns,
  data,
  isLoading,
  emptyState,
  onRowClick,
  getRowId,
  rowAccentColor,
  mobileCard,
  pagination,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
  });

  if (isLoading) {
    return <LoadingSkeleton rows={6} />;
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : 1;
  const rows = table.getRowModel().rows;

  return (
    <div>
      {/* Tarjetas compactas en móvil (evita el scroll horizontal de una
          tabla ancha en pantallas pequeñas). */}
      {mobileCard ? (
        <div className="space-y-2 sm:hidden">
          {rows.map((row) => {
            const accent = rowAccentColor?.(row.original);
            return (
              <div
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                role={onRowClick ? "button" : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onRowClick(row.original);
                  }
                }}
                style={accent ? { borderLeftColor: accent } : undefined}
                className={cn(
                  "flex min-h-[44px] items-center gap-2 rounded-[var(--radius)] border border-border bg-surface p-3",
                  accent && "border-l-[3px]",
                  onRowClick && "cursor-pointer active:bg-surface-elevated",
                )}
              >
                <div className="min-w-0 flex-1">{mobileCard(row.original)}</div>
                {onRowClick ? <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden /> : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Tabla completa desde `sm:` hacia arriba (o siempre, si no se dio mobileCard). */}
      <div className={cn("rounded-[var(--radius)] border border-border", mobileCard && "hidden sm:block")}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const sortable = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : sortable ? (
                        <button
                          className="flex items-center gap-1 hover:text-foreground"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === "asc" ? (
                            <ArrowUp className="size-3" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="size-3" />
                          ) : (
                            <ArrowUpDown className="size-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const accent = rowAccentColor?.(row.original);
              return (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  style={accent ? { borderLeftColor: accent } : undefined}
                  className={cn(onRowClick && "cursor-pointer", accent && "border-l-[3px]")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {pagination ? (
        <div className="flex items-center justify-between rounded-b-[var(--radius)] border border-t-0 border-border px-3 py-2 sm:border-t-0">
          <p className="text-xs text-muted">
            Página {pagination.page} de {totalPages} · {pagination.total} resultados
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
