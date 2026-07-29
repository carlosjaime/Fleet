import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/forms/register-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegistroPage() {
  return (
    <div className="space-y-6 animate__animated animate__fadeInUp">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Crear cuenta</h1>
        <p className="text-sm text-muted">
          Registra tu empresa y comienza a monitorear tu flotilla.
        </p>
      </div>
      <RegisterForm />
      <p className="text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-cyan hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
