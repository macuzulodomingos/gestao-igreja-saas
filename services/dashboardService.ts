import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { centsToAmount } from "@/lib/money";

export type DashboardStats = Awaited<ReturnType<typeof DashboardService.getChurchStats>>;


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
            role: m.role?.name || null,
            joinDate: m.joinDate.toISOString(),
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
            date: t.date.toISOString(),
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

  async getMembersChartData(churchId: string, locale = "pt") {
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
              label: d.toLocaleString(locale === "fr" ? "fr-FR" : "pt-AO", { month: "short", timeZone: "UTC" }),
            };
          });

          const statsMap = rawData.reduce((acc, curr) => {
            const d = new Date(curr.joinDate);
            const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
            acc[key] = (acc[key] || 0) + curr._count.id;
            return acc;
          }, {} as Record<string, number>);

          return months.map(({ year, month, label }) => ({
            month: label,
            members: statsMap[`${year}-${month}`] || 0,
          }));

          
        } catch (error) {
          console.error("[DashboardService] getMembersChartData error:", error);
          throw error;
        }
      },
      [`dashboard-members-chart-${churchId}-${locale}`],
      { revalidate: 300, tags: [`church-${churchId}`, `members-${churchId}`] }
    )();
  },

  async getFinanceChartData(churchId: string, locale = "pt") {
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

          // 👈 lookup table em vez de filter+reduce dentro do map
          const statsMap = rawData.reduce((acc, curr) => {
            const d = new Date(curr.date);
            const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${curr.type}`;
            acc[key] = (acc[key] || 0) + centsToAmount(curr._sum.amount);
            return acc;
          }, {} as Record<string, number>);


          // Monta os últimos 6 meses em UTC
          const months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1));
            return {
              year: d.getUTCFullYear(),
              month: d.getUTCMonth(),
              label: d.toLocaleString(locale === "fr" ? "fr-FR" : "pt-AO", { month: "short", timeZone: "UTC" }),
            };
          });

          return months.map(({ year, month, label }) => ({
            month: label,
            income: statsMap[`${year}-${month}-INCOME`] || 0,
            expenses: statsMap[`${year}-${month}-EXPENSE`] || 0,
          }));

        } catch (error) {
          console.error("[DashboardService] getFinanceChartData error:", error);
          throw error;
        }
      },
      [`dashboard-finance-chart-${churchId}-${locale}`],
      { revalidate: 300, tags: [`church-${churchId}`, `finances-${churchId}`] }
    )();
  },
};


