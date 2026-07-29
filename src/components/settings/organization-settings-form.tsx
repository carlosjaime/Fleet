"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { orgSettingsSchema, type OrgSettingsInput } from "@/lib/validations/settings";
import { updateOrganizationSettings } from "@/features/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError } from "@/components/forms/field-error";
import type { OrganizationSettings } from "@/types/domain";

export function OrganizationSettingsForm({ settings }: { settings: OrganizationSettings }) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrgSettingsInput>({
    resolver: zodResolver(orgSettingsSchema),
    defaultValues: {
      speed_limit_kmh: settings.speed_limit_kmh,
      low_fuel_threshold_pct: settings.low_fuel_threshold_pct,
      route_deviation_tolerance_meters: settings.route_deviation_tolerance_meters,
      delay_tolerance_minutes: settings.delay_tolerance_minutes,
      gps_offline_minutes: settings.gps_offline_minutes,
      metric_units: settings.metric_units,
      currency: settings.currency,
    },
  });

  const metricUnits = watch("metric_units");

  function onSubmit(values: OrgSettingsInput) {
    startTransition(async () => {
      const res = await updateOrganizationSettings(values);
      if (res.ok) toast.success(res.message ?? "Guardado");
      else toast.error(res.message ?? "No se pudo guardar");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="speed_limit_kmh">Límite de velocidad (km/h)</Label>
          <Input id="speed_limit_kmh" type="number" {...register("speed_limit_kmh", { valueAsNumber: true })} />
          <FieldError errors={errors.speed_limit_kmh?.message ? [errors.speed_limit_kmh.message] : undefined} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="low_fuel_threshold_pct">Umbral de combustible bajo (%)</Label>
          <Input id="low_fuel_threshold_pct" type="number" {...register("low_fuel_threshold_pct", { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="route_deviation_tolerance_meters">Tolerancia de desviación de ruta (m)</Label>
          <Input
            id="route_deviation_tolerance_meters"
            type="number"
            {...register("route_deviation_tolerance_meters", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="delay_tolerance_minutes">Tolerancia de retraso (min)</Label>
          <Input id="delay_tolerance_minutes" type="number" {...register("delay_tolerance_minutes", { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gps_offline_minutes">Minutos para considerar GPS desconectado</Label>
          <Input id="gps_offline_minutes" type="number" {...register("gps_offline_minutes", { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currency">Moneda</Label>
          <Input id="currency" {...register("currency")} maxLength={3} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={metricUnits} onCheckedChange={(v) => setValue("metric_units", v === true)} />
        Usar sistema métrico (km, litros)
      </label>

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar configuración"}
      </Button>
    </form>
  );
}
