"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { routeSchema, type RouteInput } from "@/lib/validations/routes";
import { createRoute, updateRoute } from "@/features/routes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FieldError } from "@/components/forms/field-error";
import { FormSection, FormActionsBar } from "@/components/forms/form-section";
import type { RouteWithRelations } from "@/features/routes/queries";

const NONE = "__none__";

interface OptionItem {
  id: string;
  label: string;
}

export function RouteForm({
  route,
  trucks,
  drivers,
}: {
  route?: RouteWithRelations;
  trucks: OptionItem[];
  drivers: OptionItem[];
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
    control,
    formState: { errors },
  } = useForm<RouteInput>({
    resolver: zodResolver(routeSchema),
    defaultValues: route
      ? {
          name: route.name,
          reference: route.reference ?? "",
          origin_name: route.origin_name,
          origin_latitude: route.origin_latitude,
          origin_longitude: route.origin_longitude,
          destination_name: route.destination_name,
          destination_latitude: route.destination_latitude,
          destination_longitude: route.destination_longitude,
          truck_id: route.truck_id,
          driver_id: route.driver_id,
          priority: route.priority,
          scheduled_start_at: route.scheduled_start_at?.slice(0, 16) ?? "",
          scheduled_end_at: route.scheduled_end_at?.slice(0, 16) ?? "",
          estimated_distance_km: route.estimated_distance_km ?? undefined,
          estimated_duration_minutes: route.estimated_duration_minutes ?? undefined,
          notes: route.notes ?? "",
          waypoints: [],
        }
      : { priority: "normal", waypoints: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "waypoints" });
  const priority = watch("priority");
  const truckId = watch("truck_id");
  const driverId = watch("driver_id");

  function onSubmit(values: RouteInput) {
    setServerError(null);
    startTransition(async () => {
      const result = route ? await updateRoute(route.id, values) : await createRoute(values);
      if (result.ok) {
        toast.success(result.message ?? "Guardado correctamente");
        router.push("/rutas");
        router.refresh();
        return;
      }
      if (result.fieldErrors) {
        for (const [field, msgs] of Object.entries(result.fieldErrors)) {
          if (msgs?.[0]) setError(field as keyof RouteInput, { message: msgs[0] });
        }
      }
      setServerError(result.message ?? "No se pudo guardar la ruta.");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="route-form">
      {serverError ? (
        <p role="alert" className="rounded-[var(--radius)] border border-critical/30 bg-critical/5 p-3 text-sm text-critical">
          {serverError}
        </p>
      ) : null}

      <FormSection title="Información general">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="name">Nombre de la ruta *</Label>
          <Input id="name" {...register("name")} placeholder="CDMX → Pachuca" />
          <FieldError errors={errors.name?.message ? [errors.name.message] : undefined} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reference">Referencia</Label>
          <Input id="reference" {...register("reference")} placeholder="OC-2026-001" />
          <p className="text-xs text-muted">Folio u orden de compra interna. Opcional.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="priority">Prioridad</Label>
          <Select value={priority} onValueChange={(v) => setValue("priority", v as RouteInput["priority"])}>
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baja</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormSection>

      <fieldset className="grid gap-4 rounded-[var(--radius)] border border-border p-4 sm:grid-cols-2">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-foreground">Origen</legend>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="origin_name">Nombre del origen *</Label>
          <Input id="origin_name" {...register("origin_name")} placeholder="Ciudad de México" />
          <FieldError errors={errors.origin_name?.message ? [errors.origin_name.message] : undefined} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="origin_latitude">Latitud *</Label>
          <Input id="origin_latitude" type="number" step="any" {...register("origin_latitude", { valueAsNumber: true })} />
          <FieldError errors={errors.origin_latitude?.message ? [errors.origin_latitude.message] : undefined} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="origin_longitude">Longitud *</Label>
          <Input id="origin_longitude" type="number" step="any" {...register("origin_longitude", { valueAsNumber: true })} />
          <FieldError errors={errors.origin_longitude?.message ? [errors.origin_longitude.message] : undefined} />
        </div>
      </fieldset>

      <fieldset className="grid gap-4 rounded-[var(--radius)] border border-border p-4 sm:grid-cols-2">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-foreground">Destino</legend>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="destination_name">Nombre del destino *</Label>
          <Input id="destination_name" {...register("destination_name")} placeholder="Pachuca de Soto" />
          <FieldError errors={errors.destination_name?.message ? [errors.destination_name.message] : undefined} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="destination_latitude">Latitud *</Label>
          <Input id="destination_latitude" type="number" step="any" {...register("destination_latitude", { valueAsNumber: true })} />
          <FieldError errors={errors.destination_latitude?.message ? [errors.destination_latitude.message] : undefined} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="destination_longitude">Longitud *</Label>
          <Input id="destination_longitude" type="number" step="any" {...register("destination_longitude", { valueAsNumber: true })} />
          <FieldError errors={errors.destination_longitude?.message ? [errors.destination_longitude.message] : undefined} />
        </div>
      </fieldset>

      <FormSection title="Asignación" description="Sin unidad y conductor asignados no podrás iniciar la ruta.">
        <div className="space-y-1.5">
          <Label htmlFor="truck_id">Unidad asignada</Label>
          <Select value={truckId ?? NONE} onValueChange={(v) => setValue("truck_id", v === NONE ? null : v)}>
            <SelectTrigger id="truck_id">
              <SelectValue placeholder="Sin asignar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Sin asignar</SelectItem>
              {trucks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="driver_id">Conductor asignado</Label>
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
      </FormSection>

      <FormSection title="Programación" description="Fechas y estimados de la ruta. Todos opcionales.">
        <div className="space-y-1.5">
          <Label htmlFor="scheduled_start_at">Inicio programado</Label>
          <Input id="scheduled_start_at" type="datetime-local" {...register("scheduled_start_at")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scheduled_end_at">Fin programado</Label>
          <Input id="scheduled_end_at" type="datetime-local" {...register("scheduled_end_at")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="estimated_distance_km">Distancia estimada (km)</Label>
          <Input id="estimated_distance_km" type="number" {...register("estimated_distance_km", { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="estimated_duration_minutes">Duración estimada (min)</Label>
          <Input id="estimated_duration_minutes" type="number" {...register("estimated_duration_minutes", { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea id="notes" {...register("notes")} rows={3} placeholder="Instrucciones especiales, restricciones de horario, contacto en destino…" />
        </div>
      </FormSection>

      <div className="space-y-3 rounded-[var(--radius)] border border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label>Waypoints intermedios</Label>
            <p className="mt-0.5 text-xs text-muted">Paradas obligatorias entre el origen y el destino, en orden.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ name: "", latitude: 0, longitude: 0, sequence: fields.length })}
          >
            <Plus className="size-4" /> Agregar punto
          </Button>
        </div>
        {fields.length === 0 ? (
          <p className="text-xs text-muted">Sin waypoints. La ruta usará únicamente origen y destino.</p>
        ) : (
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_auto_auto_auto] items-end gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre</Label>
                  <Input {...register(`waypoints.${index}.name` as const)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Lat</Label>
                  <Input
                    className="w-24"
                    type="number"
                    step="any"
                    {...register(`waypoints.${index}.latitude` as const, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Lng</Label>
                  <Input
                    className="w-24"
                    type="number"
                    step="any"
                    {...register(`waypoints.${index}.longitude` as const, { valueAsNumber: true })}
                  />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} aria-label="Eliminar punto">
                  <Trash2 className="size-4 text-critical" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <FormActionsBar>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : route ? "Guardar cambios" : "Crear ruta"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>
          Cancelar
        </Button>
      </FormActionsBar>
    </form>
  );
}
