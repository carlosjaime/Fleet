"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import type { OrgOption } from "./organization-switcher";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function DashboardShell({
  organizations,
  activeId,
  openAlertsCount = 0,
  children,
}: {
  organizations: OrgOption[];
  activeId: string;
  openAlertsCount?: number;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar fija en desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-border md:block">
        <div className="sticky top-0 h-dvh">
          <Sidebar openAlertsCount={openAlertsCount} />
        </div>
      </aside>

      {/* Sidebar en drawer para móvil/tablet */}
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="left-0 top-0 h-dvh max-w-[280px] translate-x-0 translate-y-0 rounded-none border-l-0 p-0">
          <DialogTitle className="sr-only">Menú de navegación</DialogTitle>
          <Sidebar openAlertsCount={openAlertsCount} onNavigate={() => setMobileOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          organizations={organizations}
          activeId={activeId}
          openAlertsCount={openAlertsCount}
          onOpenSidebar={() => setMobileOpen(true)}
        />
        <main className="flex-1 space-y-6 p-4 pb-24 sm:p-6 md:pb-6 animate__animated animate__fadeIn">{children}</main>
      </div>

      <MobileNav openAlertsCount={openAlertsCount} onMore={() => setMobileOpen(true)} />
    </div>
  );
}
