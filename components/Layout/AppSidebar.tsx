"use client";

import {
  Church,
  LayoutDashboard,
  Users,
  Calendar,
  Wallet,
  Building2,
  ShieldCheck,
  CreditCard,
  Settings
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useLocale } from "next-intl";




interface AppSidebarProps {
  slug: string;
  initialRole?: string;
}

export function AppSidebar({ slug, initialRole }: AppSidebarProps) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { data: session } = useSession();
  const isCollapsed = state === "collapsed";
  const t = useTranslations("nav"); // 👈 NOVO

  const userRole = session?.user?.role || initialRole;
  const locale = useLocale();

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };


  const navigationItems = [
    {
      title: t("dashboard"), // 👈 traduzido
      url: `/${locale}/${slug}/painel`,
      roles: ["SUPER_ADMIN", "ADMIN", "TREASURER", "SECRETARY", "OPERATOR"],
      icon: LayoutDashboard,
    },
    {
      title: t("members"),
      url: `/${locale}/${slug}/membros`,
      roles: ["SUPER_ADMIN", "ADMIN", "SECRETARY"],
      icon: Users,
    },
    {
      title: t("events"),
      url: `/${locale}/${slug}/eventos`,
      roles: ["SUPER_ADMIN", "ADMIN", "SECRETARY", "OPERATOR"],
      icon: Calendar,
    },
    {
      title: t("finance"),
      url: `/${locale}/${slug}/financas`,
      roles: ["SUPER_ADMIN", "ADMIN", "TREASURER"],
      icon: Wallet,
    },
    {
      title: t("departments"),
      url: `/${locale}/${slug}/departamentos`,
      roles: ["SUPER_ADMIN", "ADMIN", "SECRETARY"],
      icon: Building2,
    },
    {
      title: t("billing"),
      url: `/${locale}/${slug}/billing`,
      roles: ["SUPER_ADMIN", "ADMIN"],
      icon: CreditCard,
    },
    {
      title: t("settings"),
      url: `/${locale}/${slug}/configuracoes`,
      roles: ["SUPER_ADMIN", "ADMIN"],
      icon: Settings,
    },
    {
      title: t("admin"),
      url: `/admin`,
      roles: ["SUPER_ADMIN"],
      icon: ShieldCheck,
    },
  ];

  const filteredItems = navigationItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole as string);
  });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0">
            <Image
              src="/logo-icon.png" 
              alt="Ngunga"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground leading-none">NGUNGA</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                {userRole === "SUPER_ADMIN" ? "SaaS Admin" : "Gestão Igreja"}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {userRole === "SUPER_ADMIN" ? "SaaS Admin" : "Navegação"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      href={item.url}
                      onClick={handleNavClick}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}