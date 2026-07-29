"use client";

import Link from "next/link";
import { Menu, Bell } from "lucide-react";
import { Breadcrumb } from "./breadcrumb";
import { CommandSearch } from "./command-search";
import { OrganizationSwitcher, type OrgOption } from "./organization-switcher";
import { RealtimeConnectionBadge } from "./realtime-connection-badge";
import { SimulatorBadge } from "./simulator-badge";
import { OrgClock } from "./org-clock";
import { Button } from "@/components/ui/button";
import { useOrg } from "@/components/providers/org-provider";

export function Header({
  organizations,
  activeId,
  onOpenSidebar,
}: {
  organizations: OrgOption[];
  activeId: string;
  onOpenSidebar: () => void;
}) {
  const { organization } = useOrg();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenSidebar}
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </Button>

      <Breadcrumb />

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="hidden md:block">
          <CommandSearch />
        </div>
        <OrganizationSwitcher organizations={organizations} activeId={activeId} />
        <SimulatorBadge />
        <div className="hidden sm:block">
          <RealtimeConnectionBadge />
        </div>
        <Button variant="ghost" size="icon" aria-label="Ver alertas" className="relative" asChild>
          <Link href="/alertas">
            <Bell className="size-4" />
          </Link>
        </Button>
        <OrgClock timezone={organization.timezone} />
      </div>
    </header>
  );
}
