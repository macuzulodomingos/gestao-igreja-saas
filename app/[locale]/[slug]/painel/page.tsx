import { DashboardService } from "@/services/dashboardService";
import { getChurchBySlug } from "@/lib/tenant";
import { notFound, redirect } from "next/navigation";
import DashboardShell from "@/components/Dashboard/DashboardShell";
import { auth } from "@/lib/auth";

export default async function DashboardPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user) redirect("/login");

  const church = await getChurchBySlug(slug, session.user.churchId ?? undefined);
  if (!church) return notFound();

  const churchId = church.id;

  const [stats, recentMembers, recentTransactions, membersChart, financeChart] =
    await Promise.all([
      DashboardService.getChurchStats(churchId),
      DashboardService.getRecentMembers(churchId),
      DashboardService.getRecentTransactions(churchId),
      DashboardService.getMembersChartData(churchId),
      DashboardService.getFinanceChartData(churchId),
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