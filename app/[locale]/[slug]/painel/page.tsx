import { DashboardService } from "@/services/dashboardService";
import { getChurchBySlug } from "@/lib/tenant";
import { redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import DashboardShell from "@/components/Dashboard/DashboardShell";
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";




export default async function DashboardPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const session = await auth();


  if (!session?.user) {
    const locale = await getLocale();
    redirect({ href: "/login", locale });
    return;
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  if (!isSuperAdmin && session.user.churchSlug !== slug) {
    notFound();
  }

  const church = await getChurchBySlug(slug, isSuperAdmin ? undefined : session.user.churchId);
  if (!church) notFound();

  const churchId = church.id;
  const locale = await getLocale();



  const [stats, recentMembers, recentTransactions, membersChart, financeChart] =
    await Promise.all([
      DashboardService.getChurchStats(churchId).catch((err) => {
        console.error("[DASHBOARD] getChurchStats error:", err);
        return null;
      }),
      DashboardService.getRecentMembers(churchId).catch((err) => {
        console.error("[DASHBOARD] getRecentMembers error:", err); // 👈
        return [];
      }),
      DashboardService.getRecentTransactions(churchId).catch((err) => {
        console.error("[DASHBOARD] getRecentTransactions error:", err); // 👈
        return [];
      }),
      DashboardService.getMembersChartData(churchId, locale).catch((err) => {
        console.error("[DASHBOARD] getMembersChartData error:", err); // 👈
        return [];
      }),
      DashboardService.getFinanceChartData(churchId, locale).catch((err) => {
        console.error("[DASHBOARD] getFinanceChartData error:", err); // 👈
        return [];
      }),
    ]);

  return (
    <DashboardShell
      stats={stats}
      recentMembers={recentMembers}
      recentTransactions={recentTransactions}
      membersChart={membersChart}
      financeChart={financeChart}
    />
  );
}