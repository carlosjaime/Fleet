"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { truckSchema, type TruckInput } from "@/lib/validations/fleet";
import { createTruck, updateTruck } from "@/features/fleet/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FieldError } from "@/components/forms/field-error";
import { FormSection, FormActionsBar } from "@/components/forms/form-section";
import type { Truck } from "@/types/domain";

export function TruckForm({ truck }: { truck?: Truck }) {
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
  } = useForm<TruckInput>({
    resolver: zodResolver(truckSchema),
    defaultValues: truck
      ? {
          name: truck.name,
          unit_number: truck.unit_number,
          plate: truck.plate,
          vin: truck.vin ?? "",
          brand: truck.brand ?? "",
          model: truck.model ?? "",
          year: truck.year ?? undefined,
          color: truck.color ?? "",
          vehicle_type: truck.vehicle_type ?? "",
          capacity_kg: truck.capacity_kg ?? undefined,
          fuel_type: truck.fuel_type ?? "",
          fuel_capacity_liters: truck.fuel_capacity_liters ?? undefined,
          current_fuel_pct: truck.current_fuel_pct ?? undefined,
          odometer_km: truck.odometer_km,
          status: truck.status,
        }
      : { status: "idle", odometer_km: 0 },
  });

  const status = watch("status");

  function onSubmit(values: TruckInput) {
    setServerError(null);
    startTransition(async () => {
      const result = truck ? await updateTruck(truck.id, values) : await createTruck(values);
      if (result.ok) {
        toast.success(result.message ?? "Guardado correctamente");
        router.push(truck ? `/flota/${truck.id}` : "/flota");
        router.refresh();
        return;
      }
      if (result.fieldErrors) {
        for (const [field, msgs] of Object.entries(result.fieldErrors)) {
          if (msgs?.[0]) setError(field as keyof TruckInput, { message: msgs[0] });
        }
      }
      setServerError(result.message ?? "No se pudo guardar la unidad.");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="truck-form">
      {serverError ? (
        <p role="alert" className="rounded-[var(--radius)] border border-critical/30 bg-critical/5 p-3 text-sm text-critical">
          {serverError}
        </p>
      ) : null}

      <FormSection title="Identificación" description="Datos que identifican la unidad de forma única en tu flotilla.">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre de la unidad *</Label>
          <Input id="name" {...register("name")} placeholder="Camión Norte 1" />
          <FieldError errors={errors.name?.message ? [errors.name.message] : undefined} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unit_number">Número de unidad *</Label>
          <Input id="unit_number" {...register("unit_number")} placeholder="TRK-009" />
          <p className="text-xs text-muted">Debe ser único dentro de tu organización.</p>
          <FieldError errors={errors.unit_number?.message ? [errors.unit_number.message] : undefined} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="plate">Placa *</Label>
          <Input id="plate" {...register("plate")} placeholder="ABC-1234" />
          <FieldError errors={errors.plate?.message ? [errors.plate.message] : undefined} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vin">VIN</Label>
          <Input id="vin" {...register("vin")} maxLength={17} placeholder="Opcional" />
          <FieldError errors={errors.vin?.message ? [errors.vin.message] : undefined} />
        </div>
      </FormSection>

      <FormSection title="Especificaciones" description="Características del vehículo. Todos estos campos son opcionales.">
        <div className="space-y-1.5">
          <Label htmlFor="brand">Marca</Label>
          <Input id="brand" {...register("brand")} placeholder="Kenworth" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="model">Modelo</Label>
          <Input id="model" {...register("model")} placeholder="T680" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="year">Año</Label>
          <Input id="year" type="number" {...register("year", { valueAsNumber: true })} />
          <FieldError errors={errors.year?.message ? [errors.year.message] : undefined} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="color">Color</Label>
          <Input id="color" {...register("color")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vehicle_type">Tipo de vehículo</Label>
          <Input id="vehicle_type" {...register("vehicle_type")} placeholder="Tractocamión" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="capacity_kg">Capacidad de carga (kg)</Label>
          <Input id="capacity_kg" type="number" {...register("capacity_kg", { valueAsNumber: true })} />
        </div>
      </FormSection>

      <FormSection title="Combustible y kilometraje" description="Se actualizan automáticamente al recibir telemetría GPS, pero puedes ajustarlos manualmente.">
        <div className="space-y-1.5">
          <Label htmlFor="fuel_type">Tipo de combustible</Label>
          <Input id="fuel_type" {...register("fuel_type")} placeholder="Diésel" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fuel_capacity_liters">Capacidad de tanque (L)</Label>
          <Input id="fuel_capacity_liters" type="number" {...register("fuel_capacity_liters", { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="current_fuel_pct">Combustible actual (%)</Label>
          <Input id="current_fuel_pct" type="number" min={0} max={100} {...register("current_fuel_pct", { valueAsNumber: true })} />
          <FieldError errors={errors.current_fuel_pct?.message ? [errors.current_fuel_pct.message] : undefined} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="odometer_km">Odómetro (km)</Label>
          <Input id="odometer_km" type="number" {...register("odometer_km", { valueAsNumber: true })} />
        </div>
      </FormSection>

      <FormSection title="Estado operativo">
        <div className="space-y-1.5">
          <Label htmlFor="status">Estado</Label>
          <Select value={status} onValueChange={(v) => setValue("status", v as TruckInput["status"])}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="idle">Inactivo</SelectItem>
              <SelectItem value="maintenance">Mantenimiento</SelectItem>
              <SelectItem value="offline">Sin señal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormSection>

      <FormActionsBar>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : truck ? "Guardar cambios" : "Crear unidad"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>
          Cancelar
        </Button>
      </FormActionsBar>
    </form>
  );
}
