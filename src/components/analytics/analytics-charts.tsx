"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { formatCurrency } from "@/lib/utils/format";
import type { DailyDistancePoint, FuelCostPoint, AlertsByType } from "@/features/analytics/queries";

const CHART_COLORS = ["#00D9F5", "#FFB020", "#22C55E", "#EF4444", "#3B82F6", "#9299A6", "#A855F7"];

const ALERT_TYPE_LABELS: Record<string, string> = {
  speeding: "Exceso de velocidad",
  route_deviation: "Desviación de ruta",
  low_fuel: "Combustible bajo",
  delay: "Retraso",
  gps_offline: "GPS desconectado",
  maintenance_due: "Mantenimiento próximo",
  unauthorized_stop: "Parada no autorizada",
};

const tooltipStyle = {
  background: "#171A23",
  border: "1px solid #272B36",
  borderRadius: 8,
  fontSize: 12,
  color: "#F4F6F8",
};

export function DistanceChart({ data }: { data: DailyDistancePoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distancia recorrida por día</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState title="Sin datos" description="No hay telemetría GPS en el periodo seleccionado." />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#272B36" />
              <XAxis dataKey="date" stroke="#9299A6" fontSize={11} />
              <YAxis stroke="#9299A6" fontSize={11} unit=" km" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} km`, "Distancia"]} />
              <Line type="monotone" dataKey="distanceKm" stroke="#00D9F5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
        <table className="sr-only">
          <caption>Distancia recorrida por día (datos alternativos en tabla)</caption>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Distancia (km)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date}>
                <td>{d.date}</td>
                <td>{d.distanceKm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export function FuelCostChart({ data }: { data: FuelCostPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Consumo y costo de combustible</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState title="Sin datos" description="No hay cargas de combustible en el periodo seleccionado." />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#272B36" />
              <XAxis dataKey="date" stroke="#9299A6" fontSize={11} />
              <YAxis stroke="#9299A6" fontSize={11} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [name === "cost" ? formatCurrency(v) : `${v} L`, name === "cost" ? "Costo" : "Litros"]}
              />
              <Bar dataKey="liters" fill="#FFB020" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cost" fill="#00D9F5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function AlertsByTypeChart({ data }: { data: AlertsByType[] }) {
  const chartData = data.map((d) => ({ name: ALERT_TYPE_LABELS[d.type] ?? d.type, value: d.count }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas por tipo</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <EmptyState title="Sin alertas" description="No se registraron alertas en el periodo seleccionado." />
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <ResponsiveContainer width="100%" height={220} className="sm:w-1/2">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="w-full space-y-1 text-sm sm:w-1/2">
              {chartData.map((d, i) => (
                <li key={d.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    {d.name}
                  </span>
                  <span className="telemetry text-muted">{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
