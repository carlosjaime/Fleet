"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RoleBadge } from "@/components/ui/status-badges";
import { Badge } from "@/components/ui/badge";
import { inviteMember, changeMemberRole, removeMember } from "@/features/settings/actions";
import { ORG_ROLES, ROLE_LABELS } from "@/lib/permissions";
import type { OrgRole } from "@/types/domain";
import type { MemberWithProfile } from "@/features/settings/queries";

export function MembersPanel({ members, currentUserId }: { members: MemberWithProfile[]; currentUserId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgRole>("viewer");
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await inviteMember(email, inviteRole);
      if (res.ok) {
        toast.success(res.message ?? "Invitación enviada");
        setEmail("");
        router.refresh();
      } else {
        toast.error(res.message ?? "No se pudo invitar");
      }
    });
  }

  function handleRoleChange(memberId: string, role: string) {
    startTransition(async () => {
      const res = await changeMemberRole(memberId, role);
      if (res.ok) {
        toast.success("Rol actualizado");
        router.refresh();
      } else {
        toast.error(res.message ?? "No se pudo actualizar el rol");
      }
    });
  }

  function handleRemove() {
    if (!removeTarget) return;
    startTransition(async () => {
      const res = await removeMember(removeTarget);
      if (res.ok) {
        toast.success("Miembro eliminado");
        router.refresh();
      } else {
        toast.error(res.message ?? "No se pudo eliminar");
      }
      setRemoveTarget(null);
    });
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Invitar usuario</h3>
        <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-2">
          <div className="min-w-52 flex-1 space-y-1.5">
            <label className="text-xs text-muted" htmlFor="invite-email">
              Correo electrónico
            </label>
            <Input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colega@empresa.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted">Rol</label>
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as OrgRole)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORG_ROLES.filter((r) => r !== "owner").map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={pending}>
            <UserPlus className="size-4" /> Invitar
          </Button>
        </form>
      </Card>

      <div className="space-y-2">
        {members.map((m) => (
          <Card key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
            <div>
              <p className="text-sm font-medium">{m.fullName ?? "Usuario sin nombre"}</p>
              <div className="mt-1 flex items-center gap-2">
                <RoleBadge role={m.role as OrgRole} />
                {m.status === "invited" ? <Badge variant="info">Invitado</Badge> : null}
              </div>
            </div>
            {m.role !== "owner" ? (
              <div className="flex items-center gap-2">
                <Select value={m.role} onValueChange={(v) => handleRoleChange(m.id, v)} disabled={pending}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_ROLES.filter((r) => r !== "owner").map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRemoveTarget(m.id)}
                  disabled={pending || m.userId === currentUserId}
                  aria-label="Eliminar miembro"
                >
                  <Trash2 className="size-4 text-critical" />
                </Button>
              </div>
            ) : null}
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Eliminar miembro"
        description="¿Eliminar a este usuario de la organización?"
        destructive
        confirmLabel="Eliminar"
        loading={pending}
        onConfirm={handleRemove}
      />
    </div>
  );
}
