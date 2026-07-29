import type { Metadata } from "next";
import { getSessionContext } from "@/lib/auth/session";
import { listAlerts } from "@/features/alerts/queries";
import { PageHeader } from "@/components/layout/page-header";
import { AlertsView } from "@/components/alerts/alerts-view";

export const metadata: Metadata = { title: "Alertas" };

export default async function AlertasPage() {
  const ctx = await getSessionContext();
  const alerts = await listAlerts(ctx.organization.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Alertas" description="Monitorea y da seguimiento a los eventos operativos de tu flotilla." />
      <AlertsView alerts={alerts} />
    </div>
  );
}
