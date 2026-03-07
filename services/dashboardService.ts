import prisma from "@/lib/prisma";

export const DashboardService = {

  async getStats(churchId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalMembers,
      newMembersThisMonth,
      newMembersLastMonth,
      financeTotals,
    ] = await Promise.all([
      // Total de membros activos
      prisma.member.count({
        where: { churchId, status: "ATIVO" },
      }),
      // Membros que entraram este mês
      prisma.member.count({
        where: { churchId, joinDate: { gte: startOfMonth } },
      }),
      // Membros que entraram no mês passado
      prisma.member.count({
        where: { churchId, joinDate: { gte: startOfLastMonth, lte: endOfLastMonth } },
      }),
      // Totais financeiros do mês
      prisma.financeTransaction.groupBy({
        by: ["type"],
        where: { churchId, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
    ]);

    const monthlyIncome = Number(financeTotals.find(t => t.type === "INCOME")?._sum.amount ?? 0) / 100;
    const monthlyExpenses = Number(financeTotals.find(t => t.type === "EXPENSE")?._sum.amount ?? 0) / 100;

    // Crescimento de membros em % vs mês passado
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

  async getRecentMembers(churchId: string, limit = 5) {
    const members = await prisma.member.findMany({
      where: { churchId },
      include: { role: true },
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

  async getRecentTransactions(churchId: string, limit = 5) {
    const transactions = await prisma.financeTransaction.findMany({
      where: { churchId },
      include: { category: true },
      orderBy: { date: "desc" },
      take: limit,
    });

    return transactions.map(t => ({
      id: t.id,
      description: t.description,
      amount: Number(t.amount) / 100,  // 👈 adiciona Number()
      type: t.type,
      category: t.category.name,
      date: t.date,
    }));
  },

  async getMembersChartData(churchId: string) {
    // Últimos 6 meses
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

        const count = await prisma.member.count({
          where: { churchId, joinDate: { lte: end }, status: "ATIVO" },
        });

        return { month: label, members: count };
      })
    );

    return data;
  },

  async getFinanceChartData(churchId: string) {
    // Últimos 6 meses
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
};