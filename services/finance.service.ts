import prisma from "@/lib/prisma";

export async function getFinanceSummary(churchId: string, month: number, year: number) {
  // Calculamos o primeiro e último dia do mês para o filtro
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  // Buscamos todas as transações do mês em uma única query
  const transactions = await prisma.financeTransaction.findMany({
    where: {
      churchId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Agregamos os valores para o Dashboard
  const totals = transactions.reduce(
    (acc, curr) => {
      if (curr.type === "INCOME") acc.income += curr.amount;
      else acc.expense += curr.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );

  return {
    ...totals,
    balance: totals.income - totals.expense,
    transactions, // Retornamos a lista para preencher a tabela
  };
}