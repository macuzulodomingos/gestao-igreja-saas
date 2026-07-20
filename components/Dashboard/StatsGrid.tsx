"use client";
import { Users, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/format";


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
  const isBalancePositive = stats.monthlyBalance >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <StatsCard
        title={t("totalMembers")}
        value={stats.totalMembers ?? 0}
        subtitle={`+${stats.newMembersThisMonth} ${t("newMembersThisMonth")}`}
        icon={Users}
        trend={{ value: stats.memberGrowth, isPositive: stats.memberGrowth >= 0 }}
      />
      <StatsCard
        title={t("monthlyIncome")}
        value={formatCurrency(stats.monthlyIncome ?? 0)}
        subtitle={t("monthlyIncomeSubtitle")}
        icon={TrendingUp}
        valueClassName="text-green-600 dark:text-green-400"
        iconContainerClassName="bg-green-500/10 text-green-600 dark:text-green-400"
      />
      <StatsCard
        title={t("monthlyExpenses")}
        value={formatCurrency(stats.monthlyExpenses ?? 0)}
        subtitle={t("monthlyExpensesSubtitle")}
        icon={TrendingDown}
        valueClassName="text-red-600 dark:text-red-400"
        iconContainerClassName="bg-red-500/10 text-red-600 dark:text-red-400"
      />
      <StatsCard
        title={t("monthlyBalance")}
        value={formatCurrency(stats.monthlyBalance ?? 0)}
        subtitle={t("monthlyBalanceSubtitle")}
        icon={Wallet}
        valueClassName={isBalancePositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
        iconContainerClassName={isBalancePositive ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}
      />
    </div>
  );
}