"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { organizationSchema, type OrganizationInput } from "@/lib/validations/settings";
import { updateOrganizationProfile } from "@/features/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/forms/field-error";
import type { Organization } from "@/types/domain";

export function OrganizationProfileForm({ organization }: { organization: Organization }) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationInput>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization.name,
      country: organization.country,
      timezone: organization.timezone,
    },
  });

  function onSubmit(values: OrganizationInput) {
    startTransition(async () => {
      const res = await updateOrganizationProfile(values);
      if (res.ok) toast.success(res.message ?? "Guardado");
      else toast.error(res.message ?? "No se pudo guardar");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre de la empresa</Label>
        <Input id="name" {...register("name")} />
        <FieldError errors={errors.name?.message ? [errors.name.message] : undefined} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="country">País</Label>
        <Input id="country" {...register("country")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="timezone">Zona horaria</Label>
        <Input id="timezone" {...register("timezone")} placeholder="America/Mexico_City" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
