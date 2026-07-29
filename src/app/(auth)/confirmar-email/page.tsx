import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";

export const metadata: Metadata = { title: "Confirma tu correo" };

export default function ConfirmarEmailPage() {
  return (
    <div className="space-y-6 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-cyan/10 text-cyan">
        <MailCheck className="size-6" />
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Confirma tu correo</h1>
        <p className="text-sm text-muted">
          Enviamos un enlace de confirmación a tu correo. Ábrelo para activar tu cuenta.
        </p>
      </div>
      <Link href="/login" className="inline-block text-sm text-cyan hover:underline">
        Volver a iniciar sesión
      </Link>
    </div>
  );
}
