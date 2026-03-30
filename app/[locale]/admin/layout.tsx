import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Church, LayoutDashboard, LogOut, ShieldCheck, Wallet } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminLogoutButton } from "@/components/Admin/AdminLogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-60 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <Church className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-sm">ChurchOS</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Super Admin
            </p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" /> Painel Global
          </Link>
          <Link
            href="/admin/auditoria"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
          >
            <ShieldCheck className="h-4 w-4" /> Auditoria Global
          </Link>
          <Link
            href="/admin/billing"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
          >
            <Wallet className="h-4 w-4" /> Pagamentos
          </Link>
        </nav>

        <div className="p-3 border-t border-border flex items-center justify-between">
          <div>
            <p className="text-xs font-medium">{session.user.name}</p>
            <p className="text-[10px] text-muted-foreground">{session.user.email}</p>
          </div>
          <ThemeToggle />
          <AdminLogoutButton /> // 👈
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}