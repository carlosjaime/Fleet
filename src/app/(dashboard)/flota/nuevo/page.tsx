import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { TruckForm } from "@/components/fleet/truck-form";

export const metadata: Metadata = { title: "Nueva unidad" };

export default async function NuevaUnidadPage() {
  await requireRole(["owner", "admin", "dispatcher"]);
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Nueva unidad" description="Registra una unidad en tu flotilla." />
      <TruckForm />
    </div>
  );
}
