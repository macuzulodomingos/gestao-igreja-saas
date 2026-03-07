import { Users, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { StatsCard } from "./StatsCard";

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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <StatsCard
        title="Total de Membros"
        value={stats.totalMembers}
        subtitle={`+${stats.newMembersThisMonth} este mês`}
        icon={Users}
        trend={{ value: stats.memberGrowth, isPositive: stats.memberGrowth >= 0 }}
      />
      <StatsCard
        title="Receitas do Mês"
        value={formatCurrency(stats.monthlyIncome)}
        subtitle="Total de entradas"
        icon={TrendingUp}
        valueClassName="text-green-600 dark:text-green-400" // 👈
      />
      <StatsCard
        title="Despesas do Mês"
        value={formatCurrency(stats.monthlyExpenses)}
        subtitle="Total de saídas"
        icon={TrendingDown}
        valueClassName="text-red-600 dark:text-red-400"  // 👈 não existe ainda
      />
      <StatsCard
        title="Saldo do Mês"
        value={formatCurrency(stats.monthlyBalance)}
        subtitle="Receitas menos despesas"
        icon={Wallet}
        trend={{ value: 0, isPositive: stats.monthlyBalance >= 0 }}
      />
    </div>
  );
}