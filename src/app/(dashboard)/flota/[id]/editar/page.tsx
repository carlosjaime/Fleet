import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getTruck } from "@/features/fleet/queries";
import { PageHeader } from "@/components/layout/page-header";
import { TruckForm } from "@/components/fleet/truck-form";

export const metadata: Metadata = { title: "Editar unidad" };

export default async function EditarUnidadPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireRole(["owner", "admin", "dispatcher"]);
  const { id } = await params;
  const truck = await getTruck(ctx.organization.id, id);
  if (!truck) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Editar unidad" description={`${truck.unit_number} · ${truck.name}`} />
      <TruckForm truck={truck} />
    </div>
  );
}
