// services/finance.service.ts
import prisma from "@/lib/prisma";

// FUNÇÃO 1: Para os Cards (Resumo do Mês)
export async function getFinanceSummary(churchId: string, month: number, year: number) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  const transactions = await prisma.financeTransaction.findMany({
    where: {
      churchId,
      date: { gte: startDate, lte: endDate },
    },
  });

  const totals = transactions.reduce(
    (acc, curr) => {
      if (curr.type === "INCOME") acc.income += curr.amount;
      else acc.expense += curr.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );

  return {
    income: totals.income,
    expense: totals.expense,
    balance: totals.income - totals.expense,
  };
}

// FUNÇÃO 2: Para a Tabela (Lista Simples)
export async function getRecentTransactions(churchId: string, limit = 10) {
  return await prisma.financeTransaction.findMany({
    where: { churchId },
    orderBy: { date: 'desc' },
    take: limit,
  });
}