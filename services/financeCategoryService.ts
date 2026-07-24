import prisma from "@/lib/prisma";
import { TransactionType } from '@/app/generated/prisma/enums';


export interface CreateCategoryDTO {
  name: string;
  type: TransactionType;
}

export const FinanceCategoryService = {

  async getCategories(churchId: string, type?: TransactionType) {
    if (!churchId) return [];
    return prisma.financeCategory.findMany({
      where: { churchId, ...(type && { type }) },
      select: {
        id: true,
        name: true,
        type: true,
        churchId: true,
        _count: { select: { transactions: true } },
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
  },

  async createCategory(
    churchId: string,
    actor: { userId: string; email: string },
    data: CreateCategoryDTO
  ) {
    return prisma.$transaction(async (tx) => {
      // 🔒 Verifica duplicado
      const existing = await tx.financeCategory.findFirst({
        where: { churchId, name: { equals: data.name, mode: "insensitive" }, type: data.type },
        select: { id: true },
      });
      if (existing) throw new Error("CATEGORY_DUPLICATE");

      const category = await tx.financeCategory.create({
        data: { name: data.name, type: data.type, churchId },
        select: { id: true, name: true, type: true },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "CREATE_FINANCE_CATEGORY",
          entityName: "FinanceCategory",
          entityId: category.id,
          newData: { name: data.name, type: data.type },
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
    return prisma.$transaction(async (tx) => {
      // 👈 findUnique porque id é @id
      const existing = await tx.financeCategory.findUnique({
        where: { id },
        select: { id: true, name: true, type: true, churchId: true, _count: { select: { transactions: true } } },
      });

      if (!existing) throw new Error("CATEGORY_NOT_FOUND");
      if (existing.churchId !== churchId) throw new Error("CATEGORY_NOT_FOUND");

      if (existing._count.transactions > 0 && existing.type !== data.type)
        throw new Error("CATEGORY_TYPE_CHANGE_BLOCKED");

      // 🔒 Verifica duplicado excluindo a própria
      const duplicate = await tx.financeCategory.findFirst({
        where: { churchId, name: { equals: data.name, mode: "insensitive" as const }, type: data.type, NOT: { id } },
        select: { id: true },
      });
      if (duplicate) throw new Error("CATEGORY_DUPLICATE");

      const updated = await tx.financeCategory.update({
        where: { id },
        data: { name: data.name, type: data.type },
        select: { id: true, name: true, type: true },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "UPDATE_FINANCE_CATEGORY",
          entityName: "FinanceCategory",
          entityId: id,
          oldData: { name: existing.name, type: existing.type },
          newData: { name: data.name, type: data.type },
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
    return prisma.$transaction(async (tx) => {
      // 👈 findUnique porque id é @id
      const existing = await tx.financeCategory.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          type: true,
          churchId: true,
          _count: { select: { transactions: true } },
        },
      });

      if (!existing) throw new Error("CATEGORY_NOT_FOUND");
      if (existing.churchId !== churchId) throw new Error("CATEGORY_NOT_FOUND");

      if (existing._count.transactions > 0)
        throw new Error("CATEGORY_HAS_TRANSACTIONS");

      await tx.financeCategory.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "DELETE_FINANCE_CATEGORY",
          entityName: "FinanceCategory",
          entityId: id,
          oldData: { name: existing.name, type: existing.type },
        },
      });
    });
  },
};