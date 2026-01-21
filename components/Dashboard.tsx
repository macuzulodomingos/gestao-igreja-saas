"use client";
import { StatsGrid } from "@/components/Dashboard/StatsGrid";
import { MembersChart } from "@/components/Dashboard/MembersChart";
import { FinanceChart } from "@/components/Dashboard/FinanceChart";
import { RecentMembers } from "@/components/Dashboard/RecentMembers";
import { RecentTransactions } from "@/components/Dashboard/RecentTransactions";

export default function Dashboard() {
  return (
    <>
      <div className="space-y-6 md:space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Painel Principal</h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo de volta! Aqui está o que está acontecendo com a sua igreja.
          </p>
        </div>

        {/* Stats Cards */}
        <StatsGrid />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <MembersChart />
          <FinanceChart />
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <RecentMembers />
          <RecentTransactions />
        </div>
      </div>
    </>
  );
}
