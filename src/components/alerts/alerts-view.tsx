"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FilterBar } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/states";
import { AlertItem } from "./alert-item";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Bell } from "lucide-react";
import type { AlertType, AlertSeverity } from "@/types/domain";
import type { AlertWithRelations } from "@/features/alerts/queries";

const SEVERITY_ORDER: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

const TYPE_OPTIONS: { value: AlertType | "all"; label: string }[] = [
  { value: "all", label: "Todos los tipos" },
  { value: "speeding", label: "Exceso de velocidad" },
  { value: "route_deviation", label: "Desviación de ruta" },
  { value: "low_fuel", label: "Combustible bajo" },
  { value: "delay", label: "Retraso" },
  { value: "gps_offline", label: "GPS desconectado" },
  { value: "maintenance_due", label: "Mantenimiento próximo" },
  { value: "unauthorized_stop", label: "Parada no autorizada" },
];

export function AlertsView({ alerts }: { alerts: AlertWithRelations[] }) {
  const [tab, setTab] = useState("open");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<AlertType | "all">("all");
  const [severity, setSeverity] = useState<AlertSeverity | "all">("all");
  const debouncedSearch = useDebouncedValue(search, 250);

  const filteredBase = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return alerts.filter((a) => {
      if (type !== "all" && a.type !== type) return false;
      if (severity !== "all" && a.severity !== severity) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        (a.description ?? "").toLowerCase().includes(q) ||
        (a.truck?.unit_number ?? "").toLowerCase().includes(q)
      );
    });
  }, [alerts, debouncedSearch, type, severity]);

  const byTab = useMemo(() => {
    const sorted = [...filteredBase].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
    return {
      open: sorted.filter((a) => a.status === "open"),
      acknowledged: sorted.filter((a) => a.status === "acknowledged"),
      resolved: sorted.filter((a) => a.status === "resolved"),
      all: sorted,
    };
  }, [filteredBase]);

  return (
    <div className="space-y-4">
      <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Buscar alertas…">
        <Select value={type} onValueChange={(v) => setType(v as AlertType | "all")}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={severity} onValueChange={(v) => setSeverity(v as AlertSeverity | "all")}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda severidad</SelectItem>
            <SelectItem value="critical">Crítica</SelectItem>
            <SelectItem value="warning">Advertencia</SelectItem>
            <SelectItem value="info">Informativa</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="open">Abiertas ({byTab.open.length})</TabsTrigger>
          <TabsTrigger value="acknowledged">Reconocidas ({byTab.acknowledged.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resueltas ({byTab.resolved.length})</TabsTrigger>
          <TabsTrigger value="all">Todas ({byTab.all.length})</TabsTrigger>
        </TabsList>

        {(["open", "acknowledged", "resolved", "all"] as const).map((key) => (
          <TabsContent key={key} value={key} className="space-y-3">
            {byTab[key].length === 0 ? (
              <EmptyState icon={Bell} title="Sin alertas" description="No hay alertas en esta categoría." />
            ) : (
              byTab[key].map((alert) => <AlertItem key={alert.id} alert={alert} />)
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
