"use server";

/**
 * Server Actions de autenticación.
 * Toda la lógica sensible corre en el servidor con cookies seguras.
 */
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginSchema, registerSchema, recoverPasswordSchema, resetPasswordSchema } from "@/lib/validations/auth";
import { publicEnv } from "@/config/env";

export interface ActionState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "org"
  );
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { ok: false, message: "Credenciales inválidas. Verifica tu correo y contraseña." };
  }
  return { ok: true };
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    organizationName: formData.get("organizationName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { fullName, organizationName, email, password } = parsed.data;

  const supabase = await createClient();
  const { data: signUp, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/dashboard`,
    },
  });

  if (signUpError || !signUp.user) {
    return { ok: false, message: signUpError?.message ?? "No se pudo crear la cuenta." };
  }

  // Provisiona organización + membresía + settings con el cliente admin
  // (evita depender de la sesión aún no confirmada y salta RLS de forma segura).
  try {
    const admin = createAdminClient();
    const { data: org, error: orgError } = await admin
      .from("organizations")
      .insert({
        name: organizationName,
        slug: `${slugify(organizationName)}-${signUp.user.id.slice(0, 6)}`,
        created_by: signUp.user.id,
      })
      .select("id")
      .single();
    if (orgError || !org) throw orgError ?? new Error("org");

    await admin.from("organization_members").insert({
      organization_id: org.id,
      user_id: signUp.user.id,
      role: "owner",
      status: "active",
    });
    await admin.from("organization_settings").insert({ organization_id: org.id });
  } catch {
    return {
      ok: false,
      message: "La cuenta se creó pero falló la configuración inicial. Contacta soporte.",
    };
  }

  return { ok: true, message: "Cuenta creada. Revisa tu correo si la confirmación está activa." };
}

export async function recoverPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = recoverPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/restablecer-contrasena`,
  });
  // Respuesta uniforme para no filtrar si el correo existe.
  return { ok: true, message: "Si el correo existe, enviamos instrucciones para restablecer." };
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { ok: false, message: "No se pudo actualizar la contraseña. El enlace pudo expirar." };
  }
  return { ok: true, message: "Contraseña actualizada." };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
