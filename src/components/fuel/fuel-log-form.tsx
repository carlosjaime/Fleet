"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fuelLogSchema, type FuelLogInput } from "@/lib/validations/fuel";
import { createFuelLog } from "@/features/fuel/actions";
import { fuelTotalCost } from "@/lib/utils/metrics";
import { formatCurrency } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FieldError } from "@/components/forms/field-error";

const NONE = "__none__";

export function FuelLogForm({
  trucks,
  drivers,
}: {
  trucks: { id: string; label: string }[];
  drivers: { id: string; label: string }[];
}) {
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
  } = useForm<FuelLogInput>({ resolver: zodResolver(fuelLogSchema) });

  const truckId = watch("truck_id");
  const driverId = watch("driver_id");
  const liters = watch("liters");
  const pricePerLiter = watch("price_per_liter");
  const total = liters && pricePerLiter ? fuelTotalCost(liters, pricePerLiter) : null;

  function onSubmit(values: FuelLogInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await createFuelLog(values);
      if (result.ok) {
        toast.success(result.message ?? "Guardado correctamente");
        router.push("/combustible");
        router.refresh();
        return;
      }
      if (result.fieldErrors) {
        for (const [field, msgs] of Object.entries(result.fieldErrors)) {
          if (msgs?.[0]) setError(field as keyof FuelLogInput, { message: msgs[0] });
        }
      }
      setServerError(result.message ?? "No se pudo registrar la carga.");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="fuel-form">
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
          <Label htmlFor="driver_id">Conductor</Label>
          <Select value={driverId ?? NONE} onValueChange={(v) => setValue("driver_id", v === NONE ? null : v)}>
            <SelectTrigger id="driver_id">
              <SelectValue placeholder="Sin asignar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Sin asignar</SelectItem>
              {drivers.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="liters">Litros *</Label>
          <Input id="liters" type="number" step="0.01" {...register("liters", { valueAsNumber: true })} />
          <FieldError errors={errors.liters?.message ? [errors.liters.message] : undefined} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price_per_liter">Precio por litro (MXN) *</Label>
          <Input id="price_per_liter" type="number" step="0.01" {...register("price_per_liter", { valueAsNumber: true })} />
          <FieldError errors={errors.price_per_liter?.message ? [errors.price_per_liter.message] : undefined} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="odometer_km">Odómetro (km)</Label>
          <Input id="odometer_km" type="number" {...register("odometer_km", { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fuel_station">Estación</Label>
          <Input id="fuel_station" {...register("fuel_station")} placeholder="Pemex Carretera 85" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="recorded_at">Fecha</Label>
          <Input id="recorded_at" type="datetime-local" {...register("recorded_at")} />
        </div>
        <div className="flex items-end">
          <div className="w-full rounded-[var(--radius)] border border-border bg-surface-elevated p-2.5 text-sm">
            Total: <span className="telemetry font-semibold">{total != null ? formatCurrency(total) : "—"}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Registrar carga"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
