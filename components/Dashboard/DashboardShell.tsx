"use client";

import { StatsGrid } from "@/components/Dashboard/StatsGrid";
import { MembersChart } from "@/components/Dashboard/MembersChart";
import { FinanceChart } from "@/components/Dashboard/FinanceChart";
import { RecentMembers } from "@/components/Dashboard/RecentMembers";
import { RecentTransactions } from "@/components/Dashboard/RecentTransactions";
import { useTranslations } from "next-intl";

type Stats = {
  totalMembers: number;
  newMembersThisMonth: number;
  memberGrowth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBalance: number;
};

type RecentMember = {
  id: string;
  name: string;
  role: string;
  joinDate: Date;
};

type RecentTransaction = {
  id: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: Date;
};

type MembersChartPoint = { month: string; members: number };
type FinanceChartPoint = { month: string; income: number; expenses: number };

interface DashboardShellProps {
  stats: Stats;
  recentMembers: RecentMember[];
  recentTransactions: RecentTransaction[];
  membersChart: MembersChartPoint[];
  financeChart: FinanceChartPoint[];
}

export default function DashboardShell({
  stats,
  recentMembers,
  recentTransactions,
  membersChart,
  financeChart,
}: DashboardShellProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("welcome")}</p>
      </div>

      <StatsGrid stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <MembersChart data={membersChart} />
        <FinanceChart data={financeChart} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <RecentMembers members={recentMembers} />
        <RecentTransactions transactions={recentTransactions} />
      </div>
    </div>
  );
}