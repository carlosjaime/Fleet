"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Key, Plus, Ban, Copy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/states";
import { createApiKey, revokeApiKey } from "@/features/settings/actions";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/format";
import type { DeviceApiKey } from "@/types/domain";

export function ApiKeysPanel({ apiKeys }: { apiKeys: Omit<DeviceApiKey, "key_hash">[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createApiKey(name, null);
      if (res.ok && res.plainKey) {
        setNewKey(res.plainKey);
        setName("");
        router.refresh();
      } else {
        toast.error(res.message ?? "No se pudo crear la API key");
      }
    });
  }

  function handleRevoke() {
    if (!revokeTarget) return;
    startTransition(async () => {
      const res = await revokeApiKey(revokeTarget);
      if (res.ok) {
        toast.success("API key revocada");
        router.refresh();
      } else {
        toast.error(res.message ?? "No se pudo revocar");
      }
      setRevokeTarget(null);
    });
  }

  function copyKey() {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      toast.success("Copiada al portapapeles");
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Nueva API key de dispositivo</h3>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-2">
          <div className="min-w-52 flex-1 space-y-1.5">
            <label className="text-xs text-muted" htmlFor="key-name">
              Nombre
            </label>
            <Input id="key-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="GPS TRK-001" />
          </div>
          <Button type="submit" disabled={pending}>
            <Plus className="size-4" /> Crear API key
          </Button>
        </form>
      </Card>

      {apiKeys.length === 0 ? (
        <EmptyState icon={Key} title="Sin API keys" description="Crea una API key para conectar dispositivos GPS." />
      ) : (
        <div className="space-y-2">
          {apiKeys.map((k) => (
            <Card key={k.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div>
                <p className="text-sm font-medium">{k.name}</p>
                <p className="telemetry text-xs text-muted">
                  {k.key_prefix}••••••••
                  {k.status === "revoked" ? <Badge variant="critical" className="ml-2">Revocada</Badge> : <Badge variant="success" className="ml-2">Activa</Badge>}
                </p>
                <p className="text-xs text-muted">
                  {k.last_used_at ? `Último uso ${formatRelativeTime(k.last_used_at)}` : "Sin uso registrado"} · Creada{" "}
                  {formatDateTime(k.created_at)}
                </p>
              </div>
              {k.status === "active" ? (
                <Button variant="outline" size="sm" onClick={() => setRevokeTarget(k.id)} disabled={pending}>
                  <Ban className="size-4" /> Revocar
                </Button>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={newKey !== null} onOpenChange={(open) => !open && setNewKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API key creada</DialogTitle>
            <DialogDescription>
              Copia esta clave ahora. No podrás volver a verla completa después de cerrar este mensaje.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-[var(--radius)] border border-border bg-surface-elevated p-3">
            <code className="telemetry flex-1 overflow-x-auto text-sm">{newKey}</code>
            <Button variant="ghost" size="icon" onClick={copyKey} aria-label="Copiar">
              <Copy className="size-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title="Revocar API key"
        description="Los dispositivos que usen esta clave dejarán de poder enviar telemetría."
        destructive
        confirmLabel="Revocar"
        loading={pending}
        onConfirm={handleRevoke}
      />
    </div>
  );
}
