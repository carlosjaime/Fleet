import { getSessionContext, getUserMemberships } from "@/lib/auth/session";
import { getOpenAlertsCount } from "@/features/alerts/queries";
import { OrgProvider } from "@/components/providers/org-provider";
import { RealtimeProvider } from "@/components/providers/realtime-provider";
import { GpsSimulatorProvider } from "@/components/providers/gps-simulator-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getSessionContext();
  const [memberships, openAlertsCount] = await Promise.all([
    getUserMemberships(ctx.user.id),
    getOpenAlertsCount(ctx.organization.id),
  ]);

  const organizations = memberships
    .map((m) => m.organization)
    .filter((o): o is NonNullable<typeof o> => o !== null)
    .map((o) => ({ id: o.id, name: o.name }));

  const profileName =
    (ctx.user.user_metadata?.full_name as string | undefined) ??
    ctx.user.email?.split("@")[0] ??
    "Usuario";

  return (
    <OrgProvider
      value={{
        organizationId: ctx.organization.id,
        organization: ctx.organization,
        role: ctx.role,
        userId: ctx.user.id,
        userName: profileName,
        userEmail: ctx.user.email ?? "",
      }}
    >
      <RealtimeProvider>
        <GpsSimulatorProvider>
          <TooltipProvider delayDuration={200}>
            <DashboardShell
              organizations={organizations}
              activeId={ctx.organization.id}
              openAlertsCount={openAlertsCount}
            >
              {children}
            </DashboardShell>
          </TooltipProvider>
        </GpsSimulatorProvider>
      </RealtimeProvider>
    </OrgProvider>
  );
}
