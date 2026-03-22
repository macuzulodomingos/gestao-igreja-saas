import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { centsToAmount } from "@/lib/money";


// 👈 Datas sempre em UTC — evita bug de fuso horário na Vercel
function getMonthRangeUTC(year: number, month: number) {
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
  return { start, end };
}

function getCurrentMonthRangeUTC() {
  const now = new Date();
  return getMonthRangeUTC(now.getUTCFullYear(), now.getUTCMonth());
}

function getLastMonthRangeUTC() {
  const now = new Date();
  return getMonthRangeUTC(now.getUTCFullYear(), now.getUTCMonth() - 1);
}

export const DashboardService = {

  async getChurchStats(churchId: string) {
    return unstable_cache(
      async () => {
        try {
          const { start: startOfMonth } = getCurrentMonthRangeUTC();
          const { start: startOfLastMonth, end: endOfLastMonth } = getLastMonthRangeUTC();

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

          const monthlyIncome = centsToAmount(financeTotals.find(t => t.type === "INCOME")?._sum.amount);
          const monthlyExpenses = centsToAmount(financeTotals.find(t => t.type === "EXPENSE")?._sum.amount);

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
        } catch (error) {
          console.error("[DashboardService] getChurchStats error:", error);
          throw error;
        }
      },
      [`dashboard-stats-${churchId}`],
      { revalidate: 60, tags: [`church-${churchId}`, `dashboard-${churchId}`] }
    )();
  },

  async getRecentMembers(churchId: string, limit = 5) {
    return unstable_cache(
      async () => {
        try {
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
        } catch (error) {
          console.error("[DashboardService] getRecentMembers error:", error);
          throw error;
        }
      },
      [`dashboard-recent-members-${churchId}-${limit}`],
      { revalidate: 60, tags: [`church-${churchId}`, `members-${churchId}`] }
    )();
  },

  async getRecentTransactions(churchId: string, limit = 5) {
    return unstable_cache(
      async () => {
        try {
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
            amount: centsToAmount(t.amount),
            type: t.type as "INCOME" | "EXPENSE",
            category: t.category.name,
            date: t.date,
          }));
        } catch (error) {
          console.error("[DashboardService] getRecentTransactions error:", error);
          throw error;
        }
      },
      [`dashboard-recent-transactions-${churchId}-${limit}`],
      { revalidate: 60, tags: [`church-${churchId}`, `finances-${churchId}`] }
    )();
  },

  async getMembersChartData(churchId: string) {
    return unstable_cache(
      async () => {
        try {
          const now = new Date();

          // 👈 Ponto 1 — uma única query em vez de 6
          const sixMonthsAgo = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth() - 5,
            1
          ));

          // Busca todos os membros activos registados nos últimos 6 meses
          const rawData = await prisma.member.groupBy({
            by: ["joinDate"],
            where: {
              churchId,
              status: "ATIVO",
              joinDate: { gte: sixMonthsAgo },
            },
            _count: { id: true },
          });

          // Monta os últimos 6 meses em UTC
          const months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1));
            return {
              year: d.getUTCFullYear(),
              month: d.getUTCMonth(),
              label: d.toLocaleString("pt-AO", { month: "short", timeZone: "UTC" }),
            };
          });

          // Agrupa por mês no código
          return months.map(({ year, month, label }) => {
            const count = rawData.filter(r => {
              const d = new Date(r.joinDate);
              return d.getUTCFullYear() === year && d.getUTCMonth() === month;
            }).reduce((sum, r) => sum + r._count.id, 0);

            return { month: label, members: count };
          });
        } catch (error) {
          console.error("[DashboardService] getMembersChartData error:", error);
          throw error;
        }
      },
      [`dashboard-members-chart-${churchId}`],
      { revalidate: 300, tags: [`church-${churchId}`, `members-${churchId}`] }
    )();
  },

  async getFinanceChartData(churchId: string) {
    return unstable_cache(
      async () => {
        try {
          const now = new Date();

          // 👈 Ponto 1 — uma única query em vez de 6
          const sixMonthsAgo = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth() - 5,
            1
          ));

          const rawData = await prisma.financeTransaction.groupBy({
            by: ["type", "date"],
            where: {
              churchId,
              date: { gte: sixMonthsAgo },
            },
            _sum: { amount: true },
          });

          // Monta os últimos 6 meses em UTC
          const months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1));
            return {
              year: d.getUTCFullYear(),
              month: d.getUTCMonth(),
              label: d.toLocaleString("pt-AO", { month: "short", timeZone: "UTC" }),
            };
          });

          // Agrupa por mês no código
          return months.map(({ year, month, label }) => {
            const monthData = rawData.filter(r => {
              const d = new Date(r.date);
              return d.getUTCFullYear() === year && d.getUTCMonth() === month;
            });

            const income = monthData
              .filter(r => r.type === "INCOME")
              .reduce((sum, r) => sum + centsToAmount(r._sum.amount), 0);

            const expenses = monthData
              .filter(r => r.type === "EXPENSE")
              .reduce((sum, r) => sum + centsToAmount(r._sum.amount), 0);

            return { month: label, income, expenses };
          });
        } catch (error) {
          console.error("[DashboardService] getFinanceChartData error:", error);
          throw error;
        }
      },
      [`dashboard-finance-chart-${churchId}`],
      { revalidate: 300, tags: [`church-${churchId}`, `finances-${churchId}`] }
    )();
  },
};