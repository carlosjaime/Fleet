"use client";

import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { RouteStatusBadge, MaintenanceStatusBadge, AlertSeverityBadge } from "@/components/ui/status-badges";
import {
  formatCoordinate,
  formatDateTime,
  formatKm,
  formatSpeed,
  formatPercent,
  formatCurrency,
} from "@/lib/utils/format";
import type { Truck, TruckLocation, Route, MaintenanceRecord, FuelLog, Alert } from "@/types/domain";

export function TruckDetailTabs({
  truck,
  locations,
  routes,
  maintenance,
  fuelLogs,
  alerts,
}: {
  truck: Truck;
  locations: TruckLocation[];
  routes: Route[];
  maintenance: MaintenanceRecord[];
  fuelLogs: FuelLog[];
  alerts: Alert[];
}) {
  return (
    <Tabs defaultValue="general">
      <TabsList className="flex-wrap">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="historial">Historial GPS</TabsTrigger>
        <TabsTrigger value="rutas">Rutas</TabsTrigger>
        <TabsTrigger value="combustible">Combustible</TabsTrigger>
        <TabsTrigger value="mantenimiento">Mantenimiento</TabsTrigger>
        <TabsTrigger value="alertas">Alertas</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <Card>
          <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Marca / Modelo" value={[truck.brand, truck.model].filter(Boolean).join(" ") || "—"} />
            <Field label="Año" value={truck.year?.toString() ?? "—"} />
            <Field label="VIN" value={truck.vin ?? "—"} mono />
            <Field label="Tipo de vehículo" value={truck.vehicle_type ?? "—"} />
            <Field label="Capacidad" value={truck.capacity_kg ? `${truck.capacity_kg} kg` : "—"} />
            <Field label="Combustible" value={truck.fuel_type ?? "—"} />
            <Field label="Tanque" value={truck.fuel_capacity_liters ? `${truck.fuel_capacity_liters} L` : "—"} />
            <Field label="Odómetro" value={formatKm(truck.odometer_km)} />
            <Field
              label="Posición actual"
              value={
                truck.last_latitude != null && truck.last_longitude != null
                  ? formatCoordinate(truck.last_latitude, truck.last_longitude)
                  : "—"
              }
              mono
            />
            <Field label="Velocidad" value={truck.last_speed_kmh != null ? formatSpeed(truck.last_speed_kmh) : "—"} />
            <Field label="Combustible actual" value={truck.current_fuel_pct != null ? formatPercent(truck.current_fuel_pct) : "—"} />
            <Field label="Últ. telemetría" value={formatDateTime(truck.last_location_at)} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="historial">
        {locations.length === 0 ? (
          <EmptyState title="Sin historial de ubicaciones" description="Aún no se ha recibido telemetría GPS para esta unidad." />
        ) : (
          <div className="max-h-96 overflow-y-auto rounded-[var(--radius)] border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface-elevated text-xs uppercase text-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Fecha</th>
                  <th className="px-3 py-2 text-left">Coordenada</th>
                  <th className="px-3 py-2 text-left">Velocidad</th>
                  <th className="px-3 py-2 text-left">Combustible</th>
                  <th className="px-3 py-2 text-left">Origen</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((loc) => (
                  <tr key={loc.id} className="border-t border-border">
                    <td className="px-3 py-2">{formatDateTime(loc.recorded_at)}</td>
                    <td className="telemetry px-3 py-2">{formatCoordinate(loc.latitude, loc.longitude)}</td>
                    <td className="px-3 py-2">{loc.speed_kmh != null ? formatSpeed(loc.speed_kmh) : "—"}</td>
                    <td className="px-3 py-2">{loc.fuel_pct != null ? formatPercent(loc.fuel_pct) : "—"}</td>
                    <td className="px-3 py-2 capitalize text-muted">{loc.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TabsContent>

      <TabsContent value="rutas">
        {routes.length === 0 ? (
          <EmptyState title="Sin rutas asignadas" description="Esta unidad no tiene historial de rutas." />
        ) : (
          <ul className="space-y-2">
            {routes.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/rutas/${r.id}`}
                  className="flex items-center justify-between rounded-[var(--radius)] border border-border p-3 hover:bg-surface-elevated"
                >
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted">
                      {r.origin_name} → {r.destination_name}
                    </p>
                  </div>
                  <RouteStatusBadge status={r.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="combustible">
        {fuelLogs.length === 0 ? (
          <EmptyState title="Sin cargas de combustible" description="No hay registros de combustible para esta unidad." />
        ) : (
          <ul className="space-y-2">
            {fuelLogs.map((f) => (
              <li key={f.id} className="flex items-center justify-between rounded-[var(--radius)] border border-border p-3">
                <div>
                  <p className="font-medium">{f.liters} L · {formatCurrency(f.total_cost)}</p>
                  <p className="text-xs text-muted">{f.fuel_station ?? "Estación no especificada"}</p>
                </div>
                <span className="text-xs text-muted">{formatDateTime(f.recorded_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="mantenimiento">
        {maintenance.length === 0 ? (
          <EmptyState title="Sin mantenimientos" description="No hay servicios registrados para esta unidad." />
        ) : (
          <ul className="space-y-2">
            {maintenance.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-[var(--radius)] border border-border p-3">
                <div>
                  <p className="font-medium capitalize">{m.type === "preventive" ? "Preventivo" : m.type === "corrective" ? "Correctivo" : "Inspección"}</p>
                  <p className="text-xs text-muted">{m.description ?? "Sin descripción"}</p>
                </div>
                <MaintenanceStatusBadge status={m.status} />
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="alertas">
        {alerts.length === 0 ? (
          <EmptyState title="Sin alertas" description="Esta unidad no tiene alertas registradas." />
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-[var(--radius)] border border-border p-3">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-muted">{formatDateTime(a.detected_at)}</p>
                </div>
                <AlertSeverityBadge severity={a.severity} />
              </li>
            ))}
          </ul>
        )}
      </TabsContent>
    </Tabs>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={mono ? "telemetry mt-0.5 text-sm" : "mt-0.5 text-sm"}>{value}</p>
    </div>
  );
}
