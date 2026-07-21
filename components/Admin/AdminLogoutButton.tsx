"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useLocale } from "next-intl";

export function AdminLogoutButton() {
  const locale = useLocale();
  return (
    <button
      onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
    >
      <LogOut className="h-4 w-4" />
      Sair
    </button>
  );
}