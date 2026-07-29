import type { Metadata } from "next";
import { ResetForm } from "@/components/forms/reset-form";

export const metadata: Metadata = { title: "Restablecer contraseña" };

export default function RestablecerPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Restablecer contraseña</h1>
        <p className="text-sm text-muted">Ingresa tu nueva contraseña.</p>
      </div>
      <ResetForm />
    </div>
  );
}
