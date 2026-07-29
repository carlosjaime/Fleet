"use client";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { resetPasswordAction, type ActionState } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "./field-error";

const initial: ActionState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" className="w-full" disabled={pending}>
      {pending ? "Guardando…" : "Actualizar contraseña"}
    </Button>
  );
}

export function ResetForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(resetPasswordAction, initial);
  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Contraseña actualizada");
      router.replace("/dashboard");
      router.refresh();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, router]);
  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">Nueva contraseña</Label>
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
