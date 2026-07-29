import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OrganizationSettings, DeviceApiKey } from "@/types/domain";

export async function getOrganizationSettings(organizationId: string): Promise<OrganizationSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_settings")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export interface MemberWithProfile {
  id: string;
  role: string;
  status: string;
  userId: string;
  fullName: string | null;
}

export async function listMembers(organizationId: string): Promise<MemberWithProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("id, role, status, user_id, profile:profiles(full_name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true })
    .returns<{ id: string; role: string; status: string; user_id: string; profile: { full_name: string | null } | null }[]>();

  if (error) throw error;
  return (data ?? []).map((m) => ({
    id: m.id,
    role: m.role,
    status: m.status,
    userId: m.user_id,
    fullName: m.profile?.full_name ?? null,
  }));
}

export async function listApiKeys(organizationId: string): Promise<Omit<DeviceApiKey, "key_hash">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("device_api_keys")
    .select("id, organization_id, truck_id, name, key_prefix, status, last_used_at, expires_at, created_by, created_at, revoked_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
