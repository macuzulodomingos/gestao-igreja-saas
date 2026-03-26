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

interface AppSidebarProps {
  slug: string;
  initialRole?: string; // ✅ Adicionado para evitar o sumiço
}

export function AppSidebar({ slug, initialRole }: AppSidebarProps) {
  const { state } = useSidebar();
  const { data: session } = useSession();
  const isCollapsed = state === "collapsed";

  // ✅ Se o session ainda não carregou, usamos o initialRole que veio do servidor
  const userRole = session?.user?.role || initialRole;

  const navigationItems = [
    {
      title: "Painel",
      url: `/${slug}/painel`,
      roles: ["SUPER_ADMIN", "ADMIN", "TREASURER", "SECRETARY", "OPERATOR"],
      icon: LayoutDashboard,
    },
    {
      title: "Membros",
      url: `/${slug}/membros`,
      roles: ["SUPER_ADMIN", "ADMIN", "SECRETARY"],
      icon: Users,
    },
    {
      title: "Eventos",
      url: `/${slug}/eventos`,
      roles: ["SUPER_ADMIN", "ADMIN", "SECRETARY", "OPERATOR"],
      icon: Calendar,
    },
    {
      title: "Finanças",
      url: `/${slug}/financas`,
      roles: ["SUPER_ADMIN", "ADMIN", "TREASURER"],
      icon: Wallet,
    },
    {
      title: "Departamentos",
      url: `/${slug}/departamentos`,
      roles: ["SUPER_ADMIN", "ADMIN", "SECRETARY"],
      icon: Building2,
    },
    {
      title: "Faturamento",
      url: `/${slug}/billing`,
      roles: ["SUPER_ADMIN", "ADMIN"],
      icon: CreditCard,
    },
    {
      title: "Configurações",
      url: `/${slug}/configuracoes`,
      roles: ["SUPER_ADMIN", "ADMIN"],
      icon: Settings,
    },
    {
      title: "Configurações SaaS",
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shrink-0">
            <Church className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground leading-none">ChurchOS</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                {userRole === "SUPER_ADMIN" ? "SaaS Admin" : "Gestão Igreja"}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      href={item.url}
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