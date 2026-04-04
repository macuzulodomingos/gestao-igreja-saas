import { Users, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { useTranslations } from "next-intl";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 0,
  }).format(amount).replace("AOA", "Kz");

type Stats = {
  totalMembers: number;
  newMembersThisMonth: number;
  memberGrowth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBalance: number;
};

interface StatsGridProps {
  stats: Stats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  const t = useTranslations("dashboard.stats");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <StatsCard
        title={t("totalMembers")}
        value={stats.totalMembers}
        subtitle={`+${stats.newMembersThisMonth} ${t("newMembersThisMonth")}`}
        icon={Users}
        trend={{ value: stats.memberGrowth, isPositive: stats.memberGrowth >= 0 }}
      />
      <StatsCard
        title={t("monthlyIncome")}
        value={formatCurrency(stats.monthlyIncome)}
        subtitle={t("monthlyIncomeSubtitle")}
        icon={TrendingUp}
        valueClassName="text-green-600 dark:text-green-400"
      />
      <StatsCard
        title={t("monthlyExpenses")}
        value={formatCurrency(stats.monthlyExpenses)}
        subtitle={t("monthlyExpensesSubtitle")}
        icon={TrendingDown}
        valueClassName="text-red-600 dark:text-red-400"
      />
      <StatsCard
        title={t("monthlyBalance")}
        value={formatCurrency(stats.monthlyBalance)}
        subtitle={t("monthlyBalanceSubtitle")}
        icon={Wallet}
        trend={{ value: 0, isPositive: stats.monthlyBalance >= 0 }}
      />
    </div>
  );
}