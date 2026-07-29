"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loginAction, type ActionState } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "./field-error";
import { isDemoMode } from "@/config/env";

const initial: ActionState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" className="w-full" disabled={pending}>
      {pending ? "Ingresando…" : "Iniciar sesión"}
    </Button>
  );
}

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(loginAction, initial);
  const demo = isDemoMode();

  useEffect(() => {
    if (state.ok) {
      const target = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard";
      router.replace(target);
      router.refresh();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, router, redirectTo]);

  return (
    <form action={formAction} className="space-y-4" data-testid="login-form">
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={demo ? "admin@fleetops.demo" : ""}
          placeholder="tu@empresa.com"
        />
        <FieldError errors={state.fieldErrors?.email} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          defaultValue={demo ? "FleetOps2026!" : ""}
          placeholder="••••••••"
        />
        <FieldError errors={state.fieldErrors?.password} />
      </div>
      <SubmitButton />
    </form>
  );
}
