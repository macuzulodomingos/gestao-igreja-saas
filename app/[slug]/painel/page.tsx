import { DashboardService } from "@/services/dashboardService";
import { getChurchBySlug } from "@/lib/tenant";
import { notFound } from "next/navigation";
import DashboardShell from "@/components/Dashboard/DashboardShell";

export default async function DashboardPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;

  const church = await getChurchBySlug(slug);
  if (!church) return notFound();

  const { churchId } = { churchId: church.id };

  const [stats, recentMembers, recentTransactions, membersChart, financeChart] =
    await Promise.all([
      DashboardService.getStats(churchId),
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