import prisma from "@/lib/prisma";
import { TransactionType, Prisma } from "@prisma/client";
import { FinanceTransaction, FinanceStats } from "@/types/finance";

export interface CreateTransactionDTO {
  description: string;
  amount: number | string;
  type: TransactionType;
  categoryId: string;
  date: string | Date;
}

// Helper privado — fora do objecto, igual ao sanitizeForLog do MemberService
const toCents = (amount: number | string): number => {
  const parsed = typeof amount === "string"
    ? parseFloat(amount.replace(",", "."))
    : amount;

  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
};

export const FinanceService = {
  async createTransaction(
    churchId: string,
    actor: { userId: string; email: string },
    data: CreateTransactionDTO
  ): Promise<FinanceTransaction> {
    const amountInCents = toCents(data.amount);

    if (amountInCents <= 0 && data.type === "INCOME") {
      throw new Error("O valor da receita deve ser maior que zero.");
    }

    return await prisma.$transaction(async (tx) => {
      const category = await tx.financeCategory.findFirst({
        where: { id: data.categoryId, churchId, type: data.type },
      });

      if (!category) {
        throw new Error("Categoria inválida para este tipo de transação.");
      }

      const transaction = await tx.financeTransaction.create({
        data: {
          description: data.description,
          amount: amountInCents,
          type: data.type,
          categoryId: data.categoryId,
          date: new Date(data.date),
          churchId,
        },
        include: { category: true },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: `CREATE_${transaction.type}`,
          entityName: "Finance",
          entityId: transaction.id,
          newData: transaction as unknown as Prisma.InputJsonValue,
        },
      });

      return transaction as unknown as FinanceTransaction;
    });
  },

  async getFinanceStats(churchId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [allTotals, monthlyTotals] = await Promise.all([
      // Totais gerais
      prisma.financeTransaction.groupBy({
        by: ["type"],
        where: { churchId },
        _sum: { amount: true },
      }),
      // Totais do mês actual
      prisma.financeTransaction.groupBy({
        by: ["type"],
        where: { churchId, date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
    ]);

    const totalIncomes = (allTotals.find(t => t.type === "INCOME")?._sum.amount || 0) / 100;
    const totalExpenses = (allTotals.find(t => t.type === "EXPENSE")?._sum.amount || 0) / 100;
    const monthlyIncomes = (monthlyTotals.find(t => t.type === "INCOME")?._sum.amount || 0) / 100;
    const monthlyExpenses = (monthlyTotals.find(t => t.type === "EXPENSE")?._sum.amount || 0) / 100;

    return {
      totalIncomes,
      totalExpenses,
      netBalance: totalIncomes - totalExpenses,
      monthlyIncomes,
      monthlyExpenses,
      monthlyBalance: monthlyIncomes - monthlyExpenses,
    };
  },

  async getTransactions(churchId: string, limit = 50, type?: "INCOME" | "EXPENSE") {
    const records = await prisma.financeTransaction.findMany({
      where: {
        churchId,
        ...(type && { type }), // 👈 filtra por tipo se passado
      },
      include: { category: true },
      orderBy: { date: "desc" },
      take: limit,
    });

    return records.map(r => ({
      ...r,
      amount: r.amount / 100,
      category: r.category.name,
    }));
  },

  async getCategories(churchId: string, type?: TransactionType) {
    return await prisma.financeCategory.findMany({
      where: {
        churchId,
        ...(type && { type }),
      },
      orderBy: { name: "asc" },
    });
  },
};