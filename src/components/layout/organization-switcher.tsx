"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { setActiveOrganization } from "@/features/organizations/actions";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";

export interface OrgOption {
  id: string;
  name: string;
}

export function OrganizationSwitcher({
  organizations,
  activeId,
}: {
  organizations: OrgOption[];
  activeId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState(activeId);
  const active = organizations.find((o) => o.id === current);

  function handleSelect(id: string) {
    if (id === current) return;
    startTransition(async () => {
      const res = await setActiveOrganization(id);
      if (res.ok) {
        setCurrent(id);
        router.refresh();
        toast.success("Organización cambiada");
      } else {
        toast.error("No se pudo cambiar de organización");
      }
    });
  }

  if (organizations.length <= 1) {
    return (
      <div className="hidden items-center gap-2 rounded-[var(--radius)] border border-border px-3 py-1.5 text-sm sm:flex">
        <Building2 className="size-4 text-muted" />
        <span className="max-w-40 truncate">{active?.name}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        className="flex items-center gap-2 rounded-[var(--radius)] border border-border px-3 py-1.5 text-sm transition-colors hover:bg-surface-elevated focus-visible:outline-none disabled:opacity-50"
      >
        <Building2 className="size-4 text-muted" />
        <span className="max-w-40 truncate">{active?.name}</span>
        <ChevronsUpDown className="size-3.5 text-muted" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Organizaciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem key={org.id} onSelect={() => handleSelect(org.id)}>
            <Check className={cn("size-4", org.id === current ? "opacity-100" : "opacity-0")} />
            <span className="truncate">{org.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
