"use client";

import { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";

export function TenantClientWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SidebarProvider>
      {/* O Provider SEMPRE renderiza (evita o erro de Runtime).
        O conteúdo interno só renderiza após montar (evita o erro de Hydration).
      */}
      {mounted ? children : null}
    </SidebarProvider>
  );
}