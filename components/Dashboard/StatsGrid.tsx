import { Users, Calendar, Wallet, Church } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { statsData, churchInfo } from "@/lib/mock-data";

export function StatsGrid() {
  const formattedBalance = new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 0,
  }).format(statsData.monthlyBalance);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <StatsCard
        title="Total de membros"
        value={statsData.totalMembers}
        subtitle={`${statsData.memberGrowth} novidades neste mês`}
        icon={Users}
        trend={{ value: statsData.memberGrowth, isPositive: true }}
      />
      <StatsCard
        title="Eventos deste mês"
        value={statsData.eventsThisMonth}
        subtitle={`Próximo: ${statsData.nextEvent}`}
        icon={Calendar}
      />
      <StatsCard
        title="Saldo Mensal"
        value={formattedBalance}
        subtitle="Receitas vs Despesas"
        icon={Wallet}
        trend={{ value: statsData.balanceTrend, isPositive: true }}
      />
      <StatsCard
        title="Status do Plano"
        value={churchInfo.plan}
        subtitle={`Renovação: ${statsData.planRenewal}`}
        icon={Church}
      />
    </div>
  );
}
