"use client";

import { SidebarProvider } from "@/components/ui/sidebar";

export function TenantClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      {children}
    </SidebarProvider>
  );
}