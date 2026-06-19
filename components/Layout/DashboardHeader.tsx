"use client";

import { Menu, ChevronDown, LogOut, Settings, CreditCard, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RoleBadge } from "./RoleBadge";
import { signOut } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Plan } from "@/app/generated/prisma/enums";
import { useLocale } from "next-intl";


const planStyles: Record<Plan, string> = {
  FREE: "bg-slate-100 text-slate-600 border-slate-200",
  PRO: "bg-blue-100 text-blue-700 border-blue-200",
  ENTERPRISE: "bg-amber-100 text-amber-700 border-amber-200",
};

interface DashboardHeaderProps {
  church: {
    name: string;
    plan: Plan;
    slug: string;
  };
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
    image?: string | null;
  };
}

export function DashboardHeader({ church, user }: DashboardHeaderProps) {
  const router = useRouter();
  const t = useTranslations("header");
  const locale = useLocale();

  const userInitials = user.name?.trim()
    ? user.name.trim().split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center min-w-0 gap-4 flex-1">
          <SidebarTrigger className="h-9 w-9">
            <Menu className="h-5 w-5" />
          </SidebarTrigger>

          <div className="hidden md:flex items-center gap-3 border-l pl-4 border-border min-w-0">
            <h1 className="text-sm font-bold truncate text-foreground tracking-tight max-w-[180px] lg:max-w-[240px] min-w-0">
              {church.name}
            </h1>
            <Badge
              variant="outline"
              className={`text-[10px] shrink-0 uppercase font-bold px-2 py-0 ${planStyles[church.plan]}`}
            >
              {church.plan}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle />

          <div className="h-6 w-[1px] bg-border mx-1 hidden md:block" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative flex items-center px-2 hover:bg-accent transition-all select-none">
                <Avatar className="h-8 w-8 border border-border shrink-0">
                  {user.image && (
                    <AvatarImage
                      src={user.image}
                      alt={user.name ?? "Avatar"}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>

                <div className="hidden md:flex flex-col items-start leading-tight ml-3 mr-2 min-w-0 max-w-[140px]">
                  <span className="text-sm truncate block w-full font-semibold">{user.name ?? "Utilizador"}</span>
                  <RoleBadge role={user.role} />
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block shrink-0" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-60 mt-2">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1 min-w-0">
                  <p className="text-sm font-medium truncate leading-none">{user.name ?? "Utilizador"}</p>
                  <p className="text-xs leading-none truncate text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push(`/${locale}/${church.slug}/configuracoes/perfil`)}
                className="cursor-pointer gap-2"
              >
                <UserIcon className="h-4 w-4" /> {t("profileSettings")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/${locale}/${church.slug}/configuracoes`)}
                className="cursor-pointer gap-2"
              >
                <Settings className="h-4 w-4" /> {t("churchSettings")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/${locale}/${church.slug}/billing`)}
                className="cursor-pointer gap-2"
              >
                <CreditCard className="h-4 w-4" /> {t("billing")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer font-medium gap-2"
              >
                <LogOut className="h-4 w-4" /> {t("signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}