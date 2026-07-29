import type { Metadata } from "next";
import { getSessionContext } from "@/lib/auth/session";
import { getOrganizationSettings, listMembers, listApiKeys } from "@/features/settings/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OrganizationProfileForm } from "@/components/settings/organization-profile-form";
import { OrganizationSettingsForm } from "@/components/settings/organization-settings-form";
import { MembersPanel } from "@/components/settings/members-panel";
import { ApiKeysPanel } from "@/components/settings/api-keys-panel";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { EmptyState } from "@/components/ui/states";

export const metadata: Metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
  const ctx = await getSessionContext();
  const [settings, members, apiKeys] = await Promise.all([
    getOrganizationSettings(ctx.organization.id),
    listMembers(ctx.organization.id),
    listApiKeys(ctx.organization.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description="Administra tu empresa, usuarios, alertas y dispositivos." />

      <Tabs defaultValue="empresa">
        <TabsList className="flex-wrap">
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="alertas">Alertas y telemetría</TabsTrigger>
          <TabsTrigger value="api">API y dispositivos</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <PermissionGuard
            permission="settings:write"
            fallback={<EmptyState title="Sin permisos" description="No tienes permisos para editar la empresa." />}
          >
            <OrganizationProfileForm organization={ctx.organization} />
          </PermissionGuard>
        </TabsContent>

        <TabsContent value="usuarios">
          <MembersPanel members={members} currentUserId={ctx.user.id} />
        </TabsContent>

        <TabsContent value="alertas">
          <PermissionGuard
            permission="settings:write"
            fallback={<EmptyState title="Sin permisos" description="No tienes permisos para editar la configuración." />}
          >
            {settings ? (
              <OrganizationSettingsForm settings={settings} />
            ) : (
              <EmptyState title="Sin configuración" description="No se encontró configuración para esta organización." />
            )}
          </PermissionGuard>
        </TabsContent>

        <TabsContent value="api">
          <PermissionGuard
            permission="apikeys:manage"
            fallback={<EmptyState title="Sin permisos" description="No tienes permisos para gestionar API keys." />}
          >
            <ApiKeysPanel apiKeys={apiKeys} />
          </PermissionGuard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
