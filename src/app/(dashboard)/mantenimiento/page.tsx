import type { Metadata } from "next";
import { getSessionContext } from "@/lib/auth/session";
import { listMaintenanceRecords, getMaintenanceKpis } from "@/features/maintenance/queries";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { MaintenanceList } from "@/components/maintenance/maintenance-list";
import { formatCurrency } from "@/lib/utils/format";
import { Wrench, Clock, AlertOctagon, CalendarClock } from "lucide-react";

export const metadata: Metadata = { title: "Mantenimiento" };

export default async function MantenimientoPage() {
  const ctx = await getSessionContext();
  const [records, kpis] = await Promise.all([
    listMaintenanceRecords(ctx.organization.id),
    getMaintenanceKpis(ctx.organization.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Mantenimiento" description="Preventivo y correctivo de tu flotilla." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="En mantenimiento" value={kpis.inMaintenance} icon={Wrench} accent="amber" />
        <KpiCard label="Pendientes" value={kpis.pending} icon={Clock} accent="info" />
        <KpiCard label="Vencidos" value={kpis.overdue} icon={AlertOctagon} accent="critical" />
        <KpiCard label="Próximos (7 días)" value={kpis.upcoming} icon={CalendarClock} accent="cyan" />
        <KpiCard label="Costo del mes" value={formatCurrency(kpis.monthCost)} accent="success" />
      </div>

      <MaintenanceList records={records} />
    </div>
  );
}
