import prisma from "@/lib/prisma";
import { TransactionType, Prisma } from "@prisma/client";
import { 
  FinanceTransaction, 
  FinanceStats 
} from "@/types/finance";

export interface CreateTransactionDTO {
  description: string;
  amount: number | string;
  type: TransactionType;
  categoryId: string; // 👈 Alterado de category (string) para categoryId (ID da tabela)
  date: string | Date;
}

export class FinanceService {
  /**
   * Converte valor monetário para cêntimos de forma segura
   */
  private static toCents(amount: number | string): number {
    const parsed = typeof amount === "string" 
      ? parseFloat(amount.replace(',', '.')) 
      : amount;

    if (isNaN(parsed)) return 0;
    return Math.round(parsed * 100);
  }

  /**
   * Cria uma transação com Auditoria e validação de Categoria
   */
  static async createTransaction(
    churchId: string,
    actor: { userId: string; email: string },
    data: CreateTransactionDTO
  ): Promise<FinanceTransaction> {
    const amountInCents = this.toCents(data.amount);

    if (amountInCents <= 0 && data.type === "INCOME") {
      throw new Error("O valor da receita deve ser maior que zero.");
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Verificar se a categoria pertence à igreja e é do tipo correto
      const category = await tx.financeCategory.findFirst({
        where: { id: data.categoryId, churchId, type: data.type }
      });

      if (!category) {
        throw new Error("Categoria inválida para este tipo de transação.");
      }

      // 2. Criar o registro financeiro
      const transaction = await tx.financeTransaction.create({
        data: {
          description: data.description,
          amount: amountInCents,
          type: data.type,
          categoryId: data.categoryId, // 👈 Usa o ID da relação
          date: new Date(data.date),
          churchId,
        },
        include: { category: true } // Inclui os dados da categoria no retorno
      });

      // 3. Log de Auditoria
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
  }

  /**
   * Busca estatísticas (Totais)
   */
  static async getFinanceStats(churchId: string): Promise<FinanceStats> {
    const totals = await prisma.financeTransaction.groupBy({
      by: ['type'],
      where: { churchId },
      _sum: { amount: true }
    });

    const incomeCents = totals.find(t => t.type === "INCOME")?._sum.amount || 0;
    const expenseCents = totals.find(t => t.type === "EXPENSE")?._sum.amount || 0;

    return {
      totalIncomes: incomeCents / 100,
      totalExpenses: expenseCents / 100,
      netBalance: (incomeCents - expenseCents) / 100,
    };
  }

  /**
   * Lista transações com a Categoria populada
   */
  static async getTransactions(churchId: string, limit = 50): Promise<FinanceTransaction[]> {
    const records = await prisma.financeTransaction.findMany({
      where: { churchId },
      include: { category: true }, // 👈 Importante para mostrar o nome da categoria na tabela
      orderBy: { date: 'desc' },
      take: limit,
    });

    return records.map(r => ({
      ...r,
      amount: r.amount / 100,
      // Se o teu tipo FinanceTransaction ainda espera uma string em category, mapeamos aqui:
      category: r.category.name 
    })) as unknown as FinanceTransaction[];
  }

  /**
   * Busca as categorias disponíveis para a igreja (para usar no Select do formulário)
   */
  static async getCategories(churchId: string, type?: TransactionType) {
    return await prisma.financeCategory.findMany({
      where: { 
        churchId,
        ...(type && { type })
      },
      orderBy: { name: 'asc' }
    });
  }
}