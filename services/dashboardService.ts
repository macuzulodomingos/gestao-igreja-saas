import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const DashboardService = {

  async getChurchStats(churchId: string) {
    return unstable_cache(
      async () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        const [totalMembers, newMembersThisMonth, newMembersLastMonth, financeTotals] =
          await Promise.all([
            prisma.member.count({ where: { churchId, status: "ATIVO" } }),
            prisma.member.count({ where: { churchId, joinDate: { gte: startOfMonth } } }),
            prisma.member.count({ where: { churchId, joinDate: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
            prisma.financeTransaction.groupBy({
              by: ["type"],
              where: { churchId, date: { gte: startOfMonth } },
              _sum: { amount: true },
            }),
          ]);

        const monthlyIncome = Number(financeTotals.find(t => t.type === "INCOME")?._sum.amount ?? 0) / 100;
        const monthlyExpenses = Number(financeTotals.find(t => t.type === "EXPENSE")?._sum.amount ?? 0) / 100;
        const memberGrowth = newMembersLastMonth > 0
          ? Math.round(((newMembersThisMonth - newMembersLastMonth) / newMembersLastMonth) * 100)
          : newMembersThisMonth > 0 ? 100 : 0;

        return {
          totalMembers,
          newMembersThisMonth,
          memberGrowth,
          monthlyIncome,
          monthlyExpenses,
          monthlyBalance: monthlyIncome - monthlyExpenses,
        };
      },
      [`dashboard-stats-${churchId}`],
      { revalidate: 60, tags: [`church-${churchId}`, `dashboard-${churchId}`] }
    )();
  },

  async getRecentMembers(churchId: string, limit = 5) {
    return unstable_cache(
      async () => {
        const members = await prisma.member.findMany({
          where: { churchId },
          select: {
            id: true,
            name: true,
            joinDate: true,
            role: { select: { name: true } },
          },
          orderBy: { joinDate: "desc" },
          take: limit,
        });

        return members.map(m => ({
          id: m.id,
          name: m.name,
          role: m.role?.name || "Membro",
          joinDate: m.joinDate,
        }));
      },
      [`dashboard-recent-members-${churchId}`],
      { revalidate: 60, tags: [`church-${churchId}`, `members-${churchId}`] }
    )();
  },

  async getRecentTransactions(churchId: string, limit = 5) {
    return unstable_cache(
      async () => {
        const transactions = await prisma.financeTransaction.findMany({
          where: { churchId },
          select: {
            id: true,
            description: true,
            amount: true,
            type: true,
            date: true,
            category: { select: { name: true } },
          },
          orderBy: { date: "desc" },
          take: limit,
        });

        return transactions.map(t => ({
          id: t.id,
          description: t.description,
          amount: Number(t.amount) / 100,
          type: t.type,
          category: t.category.name,
          date: t.date,
        }));
      },
      [`dashboard-recent-transactions-${churchId}`],
      { revalidate: 60, tags: [`church-${churchId}`, `finances-${churchId}`] }
    )();
  },

  async getMembersChartData(churchId: string) {
    return unstable_cache(
      async () => {
        const months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - (5 - i));
          return {
            year: d.getFullYear(),
            month: d.getMonth(),
            label: d.toLocaleString("pt-AO", { month: "short" }),
          };
        });

        const data = await Promise.all(
          months.map(async ({ year, month, label }) => {
            const end = new Date(year, month + 1, 0, 23, 59, 59);
            const count = await prisma.member.count({
              where: { churchId, joinDate: { lte: end }, status: "ATIVO" },
            });
            return { month: label, members: count };
          })
        );

        return data;
      },
      [`dashboard-members-chart-${churchId}`],
      { revalidate: 300, tags: [`church-${churchId}`, `members-${churchId}`] }
    )();
  },

  async getFinanceChartData(churchId: string) {
    return unstable_cache(
      async () => {
        const months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - (5 - i));
          return {
            year: d.getFullYear(),
            month: d.getMonth(),
            label: d.toLocaleString("pt-AO", { month: "short" }),
          };
        });

        const data = await Promise.all(
          months.map(async ({ year, month, label }) => {
            const start = new Date(year, month, 1);
            const end = new Date(year, month + 1, 0, 23, 59, 59);

            const totals = await prisma.financeTransaction.groupBy({
              by: ["type"],
              where: { churchId, date: { gte: start, lte: end } },
              _sum: { amount: true },
            });

            const income = Number(totals.find(t => t.type === "INCOME")?._sum.amount ?? 0) / 100;
            const expenses = Number(totals.find(t => t.type === "EXPENSE")?._sum.amount ?? 0) / 100;

            return { month: label, income, expenses };
          })
        );

        return data;
      },
      [`dashboard-finance-chart-${churchId}`],
      { revalidate: 300, tags: [`church-${churchId}`, `finances-${churchId}`] }
    )();
  },
};