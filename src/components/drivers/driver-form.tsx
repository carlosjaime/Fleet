"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { driverSchema, type DriverInput } from "@/lib/validations/drivers";
import { createDriver, updateDriver } from "@/features/drivers/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FieldError } from "@/components/forms/field-error";
import type { Driver } from "@/types/domain";

export function DriverForm({ driver }: { driver?: Driver }) {
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
  } = useForm<DriverInput>({
    resolver: zodResolver(driverSchema),
    defaultValues: driver
      ? {
          full_name: driver.full_name,
          email: driver.email ?? "",
          phone: driver.phone ?? "",
          license_number: driver.license_number ?? "",
          license_type: driver.license_type ?? "",
          license_expiration: driver.license_expiration ?? "",
          status: driver.status,
          emergency_contact: driver.emergency_contact ?? "",
        }
      : { status: "available" },
  });

  const status = watch("status");

  function onSubmit(values: DriverInput) {
    setServerError(null);
    startTransition(async () => {
      const result = driver ? await updateDriver(driver.id, values) : await createDriver(values);
      if (result.ok) {
        toast.success(result.message ?? "Guardado correctamente");
        router.push(driver ? `/conductores/${driver.id}` : "/conductores");
        router.refresh();
        return;
      }
      if (result.fieldErrors) {
        for (const [field, msgs] of Object.entries(result.fieldErrors)) {
          if (msgs?.[0]) setError(field as keyof DriverInput, { message: msgs[0] });
        }
      }
      setServerError(result.message ?? "No se pudo guardar el conductor.");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="driver-form">
      {serverError ? (
        <p role="alert" className="rounded-[var(--radius)] border border-critical/30 bg-critical/5 p-3 text-sm text-critical">
          {serverError}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="full_name">Nombre completo *</Label>
          <Input id="full_name" {...register("full_name")} placeholder="Juan Pérez López" />
          <FieldError errors={errors.full_name?.message ? [errors.full_name.message] : undefined} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" type="email" {...register("email")} />
          <FieldError errors={errors.email?.message ? [errors.email.message] : undefined} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" {...register("phone")} placeholder="55 1234 5678" />
          <FieldError errors={errors.phone?.message ? [errors.phone.message] : undefined} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="license_number">Número de licencia</Label>
          <Input id="license_number" {...register("license_number")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="license_type">Tipo de licencia</Label>
          <Input id="license_type" {...register("license_type")} placeholder="Federal tipo E" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="license_expiration">Vencimiento de licencia</Label>
          <Input id="license_expiration" type="date" {...register("license_expiration")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Estado</Label>
          <Select value={status} onValueChange={(v) => setValue("status", v as DriverInput["status"])}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Disponible</SelectItem>
              <SelectItem value="assigned">Asignado</SelectItem>
              <SelectItem value="off_duty">Fuera de turno</SelectItem>
              <SelectItem value="suspended">Suspendido</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="emergency_contact">Contacto de emergencia</Label>
          <Input id="emergency_contact" {...register("emergency_contact")} placeholder="Nombre y teléfono" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : driver ? "Guardar cambios" : "Crear conductor"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
