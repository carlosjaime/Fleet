import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { DriverForm } from "@/components/drivers/driver-form";

export const metadata: Metadata = { title: "Nuevo conductor" };

export default async function NuevoConductorPage() {
  await requireRole(["owner", "admin", "dispatcher"]);
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Nuevo conductor" description="Registra un conductor en tu organización." />
      <DriverForm />
    </div>
  );
}
