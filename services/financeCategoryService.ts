import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type TransactionType = "INCOME" | "EXPENSE";

export interface CreateCategoryDTO {
  name: string;
  type: TransactionType;
}

export const FinanceCategoryService = {

  async getCategories(churchId: string, type?: TransactionType) {
    return await prisma.financeCategory.findMany({
      where: { churchId, ...(type && { type }) },
      include: { _count: { select: { transactions: true } } },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
  },

  async createCategory(
    churchId: string,
    actor: { userId: string; email: string },
    data: CreateCategoryDTO
  ) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.financeCategory.findFirst({
        where: { churchId, name: data.name, type: data.type },
      });

      if (existing) throw new Error("Já existe uma categoria com este nome e tipo.");

      const category = await tx.financeCategory.create({
        data: { name: data.name, type: data.type, churchId },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "CREATE_CATEGORY",
          entityName: "FinanceCategory",
          entityId: category.id,
          newData: category as unknown as Prisma.InputJsonValue,
        },
      });

      return category;
    });
  },

  async updateCategory(
    id: string,
    churchId: string,
    actor: { userId: string; email: string },
    data: CreateCategoryDTO
  ) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.financeCategory.findFirst({
        where: { id, churchId },
      });

      if (!existing) throw new Error("Categoria não encontrada ou acesso negado.");

      // Verifica duplicado (excluindo a própria)
      const duplicate = await tx.financeCategory.findFirst({
        where: { churchId, name: data.name, type: data.type, NOT: { id } },
      });

      if (duplicate) throw new Error("Já existe uma categoria com este nome e tipo.");

      const updated = await tx.financeCategory.update({
        where: { id },
        data: { name: data.name, type: data.type },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "UPDATE_CATEGORY",
          entityName: "FinanceCategory",
          entityId: id,
          oldData: existing as unknown as Prisma.InputJsonValue,
          newData: updated as unknown as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  },

  async deleteCategory(
    id: string,
    churchId: string,
    actor: { userId: string; email: string }
  ) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.financeCategory.findFirst({
        where: { id, churchId },
        include: { _count: { select: { transactions: true } } },
      });

      if (!existing) throw new Error("Categoria não encontrada ou acesso negado.");

      // Bloqueia eliminação se tiver transacções associadas
      if (existing._count.transactions > 0) {
        throw new Error(
          `Não é possível eliminar: esta categoria tem ${existing._count.transactions} transacção(ões) associada(s).`
        );
      }

      await tx.financeCategory.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "DELETE_CATEGORY",
          entityName: "FinanceCategory",
          entityId: id,
          oldData: existing as unknown as Prisma.InputJsonValue,
        },
      });

      return { success: true };
    });
  },
};