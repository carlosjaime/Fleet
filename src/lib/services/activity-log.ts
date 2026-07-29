import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/auth/session";
import type { Json } from "@/types/database.types";

export async function logActivity(
  ctx: SessionContext,
  entry: { action: string; entityType?: string; entityId?: string; metadata?: Record<string, unknown> },
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("activity_logs").insert({
    organization_id: ctx.organization.id,
    user_id: ctx.user.id,
    action: entry.action,
    entity_type: entry.entityType ?? null,
    entity_id: entry.entityId ?? null,
    metadata: (entry.metadata ?? {}) as Json,
  });
}
