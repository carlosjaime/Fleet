import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getDriver } from "@/features/drivers/queries";
import { PageHeader } from "@/components/layout/page-header";
import { DriverForm } from "@/components/drivers/driver-form";

export const metadata: Metadata = { title: "Editar conductor" };

export default async function EditarConductorPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireRole(["owner", "admin", "dispatcher"]);
  const { id } = await params;
  const driver = await getDriver(ctx.organization.id, id);
  if (!driver) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Editar conductor" description={driver.full_name} />
      <DriverForm driver={driver} />
    </div>
  );
}
