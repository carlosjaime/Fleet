"use client";

import { FileDown, Printer, MapPin, Clock, Truck, User, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCoordinate, formatDateTime, formatKm, formatPercent } from "@/lib/utils/format";

export interface RoutePdfReportProps {
  organizationName: string;
  route: {
    id: string;
    name: string;
    status: string;
    origin_name: string;
    origin_latitude: number;
    origin_longitude: number;
    destination_name: string;
    destination_latitude: number;
    destination_longitude: number;
    scheduled_start_at?: string | null;
    scheduled_end_at?: string | null;
    actual_start_at?: string | null;
    actual_end_at?: string | null;
    estimated_distance_km?: number | null;
    progress_pct: number;
    truck?: { unit_number: string; name: string } | null;
    driver?: { full_name: string } | null;
  };
  waypoints?: {
    id: string;
    sequence: number;
    name: string;
    latitude: number;
    longitude: number;
    status: string;
  }[];
  activityLogs?: {
    id: string;
    action: string;
    created_at: string;
  }[];
}

export function RoutePdfReport({ organizationName, route, waypoints = [], activityLogs = [] }: RoutePdfReportProps) {
  const handlePrintPdf = () => {
    window.print();
  };

  const isDelayed =
    route.scheduled_end_at &&
    route.actual_end_at &&
    new Date(route.actual_end_at) > new Date(route.scheduled_end_at);

  return (
    <div>
      <Button
        onClick={handlePrintPdf}
        variant="primary"
        className="inline-flex items-center gap-2 font-medium bg-cyan-600 hover:bg-cyan-500 text-white"
      >
        <FileDown className="h-4 w-4" />
        Descargar Reporte PDF
      </Button>

      {/* Vista oculta en pantalla normal pero estructurada para renderizado de impresión PDF */}
      <div id="pdf-report-template" className="hidden print:block print:p-8 print:bg-white print:text-slate-900 font-sans">
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">FleetOps — Reporte Oficial de Ruta</h1>
            <p className="text-sm text-slate-600 font-medium">{organizationName} · Gestión de Flotas</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono text-slate-500 uppercase block">ID de Ruta</span>
            <span className="font-mono text-xs font-bold text-slate-900">{route.id}</span>
            <p className="text-[11px] text-slate-500 mt-1">Generado: {new Date().toLocaleString()}</p>
          </div>
        </div>

        {/* Resumen de Ruta */}
        <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{route.name}</h2>
            <div className="mt-2 space-y-1 text-sm text-slate-700">
              <p><strong>Origen:</strong> {route.origin_name} <span className="font-mono text-xs text-slate-500">({formatCoordinate(route.origin_latitude, route.origin_longitude)})</span></p>
              <p><strong>Destino:</strong> {route.destination_name} <span className="font-mono text-xs text-slate-500">({formatCoordinate(route.destination_latitude, route.destination_longitude)})</span></p>
              <p><strong>Distancia Estimada:</strong> {route.estimated_distance_km ? formatKm(route.estimated_distance_km) : "N/D"}</p>
            </div>
          </div>
          <div>
            <div className="space-y-1 text-sm text-slate-700">
              <p><strong>Unidad Asignada:</strong> {route.truck ? `${route.truck.unit_number} - ${route.truck.name}` : "Sin Asignar"}</p>
              <p><strong>Conductor:</strong> {route.driver?.full_name ?? "Sin Asignar"}</p>
              <p><strong>Estado de Ruta:</strong> <span className="uppercase font-bold text-xs">{route.status}</span></p>
              <p><strong>Progreso Completado:</strong> {formatPercent(route.progress_pct)}</p>
            </div>
          </div>
        </div>

        {/* Tabla de Llegadas y Tiempos */}
        <div className="mb-6">
          <h3 className="text-md font-bold text-slate-900 mb-2 border-b pb-1">Cronograma de Salida y Llegadas (ETA vs ATA)</h3>
          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-2 border-r border-slate-300">Hito</th>
                <th className="p-2 border-r border-slate-300">Horario Programado</th>
                <th className="p-2 border-r border-slate-300">Horario Real / Ejecución</th>
                <th className="p-2">Estado / Cumplimiento</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="p-2 font-medium border-r border-slate-200">Salida (Origen)</td>
                <td className="p-2 font-mono border-r border-slate-200">{formatDateTime(route.scheduled_start_at)}</td>
                <td className="p-2 font-mono border-r border-slate-200">{formatDateTime(route.actual_start_at)}</td>
                <td className="p-2 font-semibold text-emerald-700">
                  {route.actual_start_at ? "Iniciada" : "Pendiente"}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-2 font-medium border-r border-slate-200">Llegada Estimada (Destino)</td>
                <td className="p-2 font-mono border-r border-slate-200">{formatDateTime(route.scheduled_end_at)}</td>
                <td className="p-2 font-mono border-r border-slate-200">{formatDateTime(route.actual_end_at)}</td>
                <td className="p-2 font-semibold">
                  {isDelayed ? (
                    <span className="text-rose-700">Atrasada</span>
                  ) : route.actual_end_at ? (
                    <span className="text-emerald-700">A Tiempo</span>
                  ) : (
                    <span className="text-slate-600">En Progreso</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Waypoints */}
        {waypoints.length > 0 ? (
          <div className="mb-6">
            <h3 className="text-md font-bold text-slate-900 mb-2 border-b pb-1">Waypoints Intermedios</h3>
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="p-2 border-r border-slate-300">#</th>
                  <th className="p-2 border-r border-slate-300">Ubicación / Punto</th>
                  <th className="p-2 border-r border-slate-300">Coordenadas GPS</th>
                  <th className="p-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {waypoints.map((w) => (
                  <tr key={w.id} className="border-b border-slate-200">
                    <td className="p-2 font-bold border-r border-slate-200">{w.sequence + 1}</td>
                    <td className="p-2 border-r border-slate-200">{w.name}</td>
                    <td className="p-2 font-mono border-r border-slate-200">{formatCoordinate(w.latitude, w.longitude)}</td>
                    <td className="p-2 capitalize">{w.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {/* Historial de Eventos */}
        {activityLogs.length > 0 ? (
          <div>
            <h3 className="text-md font-bold text-slate-900 mb-2 border-b pb-1">Registro de Eventos y Telemetría</h3>
            <ul className="space-y-1 text-xs text-slate-700">
              {activityLogs.map((a) => (
                <li key={a.id} className="flex justify-between border-b border-slate-100 pb-1">
                  <span>• {a.action}</span>
                  <span className="font-mono text-slate-500">{formatDateTime(a.created_at)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-8 pt-4 border-t text-center text-[10px] text-slate-400">
          Documento generado automáticamente por el Sistema FleetOps. Confidencial y de uso operativo exclusivo.
        </div>
      </div>

      {/* Estilo CSS Global de Impresión PDF */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #pdf-report-template, #pdf-report-template * {
            visibility: visible;
          }
          #pdf-report-template {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
