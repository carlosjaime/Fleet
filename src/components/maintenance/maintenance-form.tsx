"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { maintenanceSchema, type MaintenanceInput } from "@/lib/validations/maintenance";
import { createMaintenance } from "@/features/maintenance/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FieldError } from "@/components/forms/field-error";

export function MaintenanceForm({ trucks }: { trucks: { id: string; label: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MaintenanceInput>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: { type: "preventive", status: "scheduled" },
  });

  const type = watch("type");
  const status = watch("status");
  const truckId = watch("truck_id");

  function onSubmit(values: MaintenanceInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await createMaintenance(values);
      if (result.ok) {
        toast.success(result.message ?? "Guardado correctamente");
        router.push("/mantenimiento");
        router.refresh();
        return;
      }
      if (result.fieldErrors) {
        for (const [field, msgs] of Object.entries(result.fieldErrors)) {
          if (msgs?.[0]) setError(field as keyof MaintenanceInput, { message: msgs[0] });
        }
      }
      setServerError(result.message ?? "No se pudo registrar el mantenimiento.");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="maintenance-form">
      {serverError ? (
        <p role="alert" className="rounded-[var(--radius)] border border-critical/30 bg-critical/5 p-3 text-sm text-critical">
          {serverError}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="truck_id">Unidad *</Label>
          <Select value={truckId} onValueChange={(v) => setValue("truck_id", v)}>
            <SelectTrigger id="truck_id">
              <SelectValue placeholder="Selecciona una unidad" />
            </SelectTrigger>
            <SelectContent>
              {trucks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={errors.truck_id?.message ? [errors.truck_id.message] : undefined} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="type">Tipo</Label>
          <Select value={type} onValueChange={(v) => setValue("type", v as MaintenanceInput["type"])}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="preventive">Preventivo</SelectItem>
              <SelectItem value="corrective">Correctivo</SelectItem>
              <SelectItem value="inspection">Inspección</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea id="description" {...register("description")} rows={2} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Estado</Label>
          <Select value={status} onValueChange={(v) => setValue("status", v as MaintenanceInput["status"])}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Programado</SelectItem>
              <SelectItem value="in_progress">En proceso</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scheduled_at">Fecha programada</Label>
          <Input id="scheduled_at" type="datetime-local" {...register("scheduled_at")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="odometer_at_service">Odómetro al servicio (km)</Label>
          <Input id="odometer_at_service" type="number" {...register("odometer_at_service", { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cost">Costo (MXN)</Label>
          <Input id="cost" type="number" step="0.01" {...register("cost", { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="next_service_odometer">Próximo servicio (km)</Label>
          <Input id="next_service_odometer" type="number" {...register("next_service_odometer", { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="next_service_date">Próximo servicio (fecha)</Label>
          <Input id="next_service_date" type="date" {...register("next_service_date")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="provider">Proveedor</Label>
          <Input id="provider" {...register("provider")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea id="notes" {...register("notes")} rows={2} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Registrar mantenimiento"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
