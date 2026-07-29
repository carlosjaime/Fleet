"use client";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { recoverPasswordAction, type ActionState } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "./field-error";

const initial: ActionState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" className="w-full" disabled={pending}>
      {pending ? "Enviando…" : "Enviar instrucciones"}
    </Button>
  );
}

export function RecoverForm() {
  const [state, formAction] = useActionState(recoverPasswordAction, initial);
  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
  }, [state]);
  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError errors={state.fieldErrors?.email} />
      </div>
      <SubmitButton />
    </form>
  );
}
