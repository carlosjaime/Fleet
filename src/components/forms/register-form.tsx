"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registerAction, type ActionState } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "./field-error";

const initial: ActionState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" className="w-full" disabled={pending}>
      {pending ? "Creando cuenta…" : "Crear cuenta"}
    </Button>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(registerAction, initial);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Cuenta creada");
      router.replace("/dashboard");
      router.refresh();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4" data-testid="register-form">
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Nombre completo</Label>
        <Input id="fullName" name="fullName" required placeholder="Ana Martínez" />
        <FieldError errors={state.fieldErrors?.fullName} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="organizationName">Empresa</Label>
        <Input id="organizationName" name="organizationName" required placeholder="Transportes Horizonte" />
        <FieldError errors={state.fieldErrors?.organizationName} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError errors={state.fieldErrors?.email} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
        <FieldError errors={state.fieldErrors?.password} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
        <FieldError errors={state.fieldErrors?.confirmPassword} />
      </div>
      <SubmitButton />
    </form>
  );
}
