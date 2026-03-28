import prisma from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import { FinanceTransaction } from "@/types/finance";
import { centsToAmount, amountToCents, getMonthRangeInTimezone } from "@/lib/money";
import { fromZonedTime } from "date-fns-tz";

export interface CreateTransactionDTO {
  description: string;
  amount: number | string;
  type: TransactionType;
  categoryId: string;
  date: string | Date;
}



export const FinanceService = {

  async createTransaction(
    churchId: string,
    actor: { userId: string; email: string },
    data: CreateTransactionDTO
  ): Promise<FinanceTransaction> {
    const amountInCents = amountToCents(data.amount);
    if (amountInCents <= 0) throw new Error("INVALID_AMOUNT");

    return prisma.$transaction(async (tx) => {
      // 🔒 Verifica que a categoria pertence à igreja e tem o tipo correcto
      const category = await tx.financeCategory.findUnique({
        where: { id: data.categoryId },
        select: { id: true, name: true, type: true, churchId: true },
      });

      if (!category || category.churchId !== churchId)
        throw new Error("INVALID_CATEGORY");
      if (category.type !== data.type)
        throw new Error("CATEGORY_TYPE_MISMATCH");

      const transaction = await tx.financeTransaction.create({
        data: {
          description: data.description,
          amount: amountInCents,
          type: data.type,
          categoryId: data.categoryId,
          date: data.date instanceof Date ? data.date : new Date(data.date),
          churchId,
        },
        select: {
          id: true,
          description: true,
          amount: true,
          type: true,
          date: true,
          category: { select: { id: true, name: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: `CREATE_${data.type}`,
          entityName: "Finance",
          entityId: transaction.id,
          newData: {
            description: data.description,
            amount: amountInCents.toString(), // "15000" = 150.00 AOA
            type: data.type,
            category: category.name,
            date: data.date,
          },
        },
      });

      return transaction as unknown as FinanceTransaction;
    });
  },

  async updateTransaction(
    id: string,
    churchId: string,
    actor: { userId: string; email: string },
    data: CreateTransactionDTO
  ) {
    const amountInCents = amountToCents(data.amount);
    if (amountInCents <= 0) throw new Error("INVALID_AMOUNT");

    return prisma.$transaction(async (tx) => {
      // 👈 findUnique porque id é @id
      const existing = await tx.financeTransaction.findUnique({
        where: { id },
        select: { id: true, description: true, amount: true, type: true, date: true, churchId: true },
      });

      if (!existing) throw new Error("TRANSACTION_NOT_FOUND");
      if (existing.churchId !== churchId) throw new Error("TRANSACTION_NOT_FOUND");

      // 🔒 Verifica que a categoria pertence à igreja
      const category = await tx.financeCategory.findUnique({
        where: { id: data.categoryId },
        select: { id: true, name: true, type: true, churchId: true },
      });

      if (!category || category.churchId !== churchId)
        throw new Error("INVALID_CATEGORY");
      if (category.type !== data.type)
        throw new Error("CATEGORY_TYPE_MISMATCH");

      const updated = await tx.financeTransaction.update({
        where: { id },
        data: {
          description: data.description,
          amount: amountInCents,
          type: data.type,
          categoryId: data.categoryId,
          date: data.date instanceof Date ? data.date : new Date(data.date),
        },
        select: {
          id: true,
          description: true,
          amount: true,
          type: true,
          date: true,
          category: { select: { id: true, name: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: `UPDATE_${data.type}`,
          entityName: "Finance",
          entityId: id,
          oldData: {
            description: existing.description,
            amount: existing.amount.toString(),
            type: existing.type,
            date: existing.date,
          },
          newData: {
            description: data.description,
            amount: amountInCents.toString(),
            type: data.type,
            category: category.name,
            date: data.date,
          },
        },
      });

      return updated;
    });
  },

  async deleteTransaction(
    id: string,
    churchId: string,
    actor: { userId: string; email: string }
  ) {
    return prisma.$transaction(async (tx) => {
      // 👈 findUnique porque id é @id
      const existing = await tx.financeTransaction.findUnique({
        where: { id },
        select: { id: true, description: true, amount: true, type: true, date: true, churchId: true },
      });

      if (!existing) throw new Error("TRANSACTION_NOT_FOUND");
      if (existing.churchId !== churchId) throw new Error("TRANSACTION_NOT_FOUND");

      await tx.financeTransaction.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: `DELETE_${existing.type}`,
          entityName: "Finance",
          entityId: id,
          oldData: {
            description: existing.description,
            amount: existing.amount.toString(),
            type: existing.type,
            date: existing.date,
          },
        },
      });
    });
  },

  async getFinanceStats(churchId: string, timezone: string, month?: number, year?: number) {
    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();

    // 👈 calcula início e fim do mês no timezone da igreja
    const { startOfMonth, endOfMonth } = getMonthRangeInTimezone(y, m, timezone);

    const [allTotals, monthlyTotals] = await Promise.all([
      prisma.financeTransaction.groupBy({
        by: ["type"],
        where: { churchId },
        _sum: { amount: true },
      }),
      prisma.financeTransaction.groupBy({
        by: ["type"],
        where: { churchId, date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
    ]);

    const totalIncomes = centsToAmount(allTotals.find(t => t.type === "INCOME")?._sum.amount);
    const totalExpenses = centsToAmount(allTotals.find(t => t.type === "EXPENSE")?._sum.amount);
    const monthlyIncomes = centsToAmount(monthlyTotals.find(t => t.type === "INCOME")?._sum.amount);
    const monthlyExpenses = centsToAmount(monthlyTotals.find(t => t.type === "EXPENSE")?._sum.amount);

    return {
      totalIncomes,
      totalExpenses,
      netBalance: totalIncomes - totalExpenses,
      monthlyIncomes,
      monthlyExpenses,
      monthlyBalance: monthlyIncomes - monthlyExpenses,
    };
  },

  async getTransactions(
    churchId: string,
    limit = 20,
    type?: TransactionType,
    month?: number,
    year?: number,
    timezone = "Africa/Luanda",
    cursor?: string  // 👈 id da última transacção carregada
  ) {

    const dateFilter = month && year ? {
      date: {
        gte: fromZonedTime(
          `${year}-${String(month).padStart(2, "0")}-01T00:00:00`,
          timezone
        ),
        lte: fromZonedTime(
          `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}T23:59:59.999`,
          timezone
        ),
      }
    } : {};

    const records = await prisma.financeTransaction.findMany({
      where: { churchId, ...(type && { type }), ...dateFilter },
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        date: true,
        category: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
      take: limit + 1, // 👈 busca 1 a mais para saber se há próxima página
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // 👈 skip o cursor
      }),
    });

    const hasMore = records.length > limit;
    const data = hasMore ? records.slice(0, limit) : records;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return {
    data: data.map(r => ({
      ...r,
      amount: centsToAmount(r.amount),
      category: r.category.name,
    })),
    nextCursor,
    hasMore,
  };
},
  async getCategories(churchId: string, type?: TransactionType) {
    return prisma.financeCategory.findMany({
      where: { churchId, ...(type && { type }) },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    });
  },
};