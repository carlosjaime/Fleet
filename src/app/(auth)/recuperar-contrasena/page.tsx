import type { Metadata } from "next";
import Link from "next/link";
import { RecoverForm } from "@/components/forms/recover-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecuperarPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Recuperar contraseña</h1>
        <p className="text-sm text-muted">Te enviaremos un enlace para restablecerla.</p>
      </div>
      <RecoverForm />
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="text-cyan hover:underline">Volver a iniciar sesión</Link>
      </p>
    </div>
  );
}
