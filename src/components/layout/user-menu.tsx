"use client";

import { LogOut, User as UserIcon, Settings } from "lucide-react";
import Link from "next/link";
import { useOrg } from "@/components/providers/org-provider";
import { logoutAction } from "@/features/auth/actions";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(name: string): string {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "US"
  );
}

export function UserMenu() {
  const { userName, userEmail } = useOrg();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-[var(--radius)] px-2 py-2 text-left transition-colors hover:bg-surface-elevated focus-visible:outline-none">
        <Avatar>
          <AvatarFallback>{initials(userName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{userName || "Usuario"}</p>
          <p className="truncate text-xs text-muted">{userEmail}</p>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/configuracion">
            <UserIcon /> Perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/configuracion">
            <Settings /> Configuración
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <button type="submit" className="w-full">
            <DropdownMenuItem destructive onSelect={(e) => e.preventDefault()}>
              <LogOut /> Cerrar sesión
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
