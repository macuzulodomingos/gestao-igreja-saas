import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Church, LayoutDashboard, ShieldCheck, Wallet } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminLogoutButton } from "@/components/Admin/AdminLogoutButton";
import { BillingService } from "@/services/billingService";
import { getLocale } from "next-intl/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    const locale = await getLocale();
    redirect({ href: "/login", locale });
    return;
  }

  if (session.user.role !== "SUPER_ADMIN") {
    notFound();
  }

  const pendingCount = await BillingService.getPendingPayments()
    .then(p => p.length)
    .catch((error) => {
      console.error("[ADMIN_LAYOUT] getPendingPayments error:", error);
      return 0;
    });

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
            {pendingCount > 0 && (
              <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </Link>
        </nav>

        <div className="p-3 border-t border-border flex items-center justify-between">
          <div>
            <p className="text-xs font-medium">{session.user.name}</p>
            <p className="text-[10px] text-muted-foreground">{session.user.email}</p>
          </div>
          <ThemeToggle />
          <AdminLogoutButton /> 
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 md:p-8 overflow-auto">

        {/* 👈 banner de pagamentos pendentes */}
        {pendingCount > 0 && (
          <div className="mb-6 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-400">
              <Wallet className="h-4 w-4 shrink-0" />
              <span>
                <strong>{pendingCount}</strong> pagamento(s) pendente(s) a aguardar confirmação.
              </span>
            </div>
            <Link
              href="/admin/billing"
              className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline shrink-0"
            >
              Ver agora →
            </Link>
          </div>
        )}

        {children}
      </main>
    </div>
  );
}