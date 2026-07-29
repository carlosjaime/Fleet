/**
 * Helpers compartidos para pruebas de integración contra Supabase real.
 * Requieren NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY y
 * SUPABASE_SERVICE_ROLE_KEY apuntando a una instancia local (ver README.md
 * de esta carpeta).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function isIntegrationEnvReady(): boolean {
  return Boolean(SUPABASE_URL && ANON_KEY && SERVICE_ROLE_KEY);
}

// `describe.skip(name, fn)` still invokes `fn` during collection to
// register the (skipped) tests, so any top-level `createAdminTestClient()`
// inside a skipped suite still executes. When the real env isn't
// configured, fall back to a syntactically valid but inert local URL so
// the SupabaseClient constructor doesn't throw; no network call is ever
// made because the tests themselves never run under `.skip`.
const PLACEHOLDER_URL = "http://127.0.0.1:54321";
const PLACEHOLDER_KEY = "placeholder-key-unused-when-skipped";

export function createAdminTestClient(): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL || PLACEHOLDER_URL, SERVICE_ROLE_KEY || PLACEHOLDER_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function createAnonTestClient(): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL || PLACEHOLDER_URL, ANON_KEY || PLACEHOLDER_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

let counter = 0;
export function uniqueEmail(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}@fleetops.test`;
}

export interface TestUser {
  id: string;
  email: string;
  client: SupabaseClient<Database>;
}

/** Crea un usuario confirmado y devuelve un cliente autenticado como ese usuario. */
export async function createTestUser(admin: SupabaseClient<Database>, prefix: string): Promise<TestUser> {
  const email = uniqueEmail(prefix);
  const password = "TestPassword123!";
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new Error(`No se pudo crear usuario de prueba: ${error?.message}`);

  const client = createAnonTestClient();
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(`No se pudo iniciar sesión de prueba: ${signInError.message}`);

  return { id: data.user.id, email, client };
}

/** Crea una organización + membresía owner para un usuario de prueba (vía admin, salta RLS). */
export async function createTestOrganization(
  admin: SupabaseClient<Database>,
  ownerId: string,
  namePrefix = "Org Prueba",
) {
  const slug = `test-org-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const { data: org, error } = await admin
    .from("organizations")
    .insert({ name: `${namePrefix} ${slug}`, slug, created_by: ownerId })
    .select("*")
    .single();
  if (error || !org) throw new Error(`No se pudo crear organización de prueba: ${error?.message}`);

  await admin
    .from("organization_members")
    .insert({ organization_id: org.id, user_id: ownerId, role: "owner", status: "active" });
  await admin.from("organization_settings").insert({ organization_id: org.id });

  return org;
}

export async function addMember(
  admin: SupabaseClient<Database>,
  organizationId: string,
  userId: string,
  role: "owner" | "admin" | "dispatcher" | "operator" | "viewer",
) {
  await admin.from("organization_members").insert({ organization_id: organizationId, user_id: userId, role, status: "active" });
}

export async function cleanupOrganization(admin: SupabaseClient<Database>, organizationId: string) {
  await admin.from("organizations").delete().eq("id", organizationId);
}

export async function deleteTestUser(admin: SupabaseClient<Database>, userId: string) {
  await admin.auth.admin.deleteUser(userId);
}
