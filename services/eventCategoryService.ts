import prisma from "@/lib/prisma";

export interface CreateEventCategoryDTO {
  name: string;
}

export const EventCategoryService = {
  async getCategories(churchId: string) {
    return prisma.eventCategory.findMany({
      where: { churchId },
      select: {
        id: true,
        name: true,
        _count: { select: { events: true } },
      },
      orderBy: { name: "asc" },
    });
  },

  async createCategory(
    churchId: string,
    actor: { userId: string; email: string },
    data: CreateEventCategoryDTO
  ) {
    return prisma.$transaction(async (tx) => {
      const category = await tx.eventCategory.create({
        data: { name: data.name, churchId },
        select: { id: true, name: true },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "CREATE_EVENT_CATEGORY",
          entityName: "EventCategory",
          entityId: category.id,
          newData: { name: data.name },
        },
      });

      return category;
    });
  },

  async updateCategory(
    id: string,
    churchId: string,
    actor: { userId: string; email: string },
    data: CreateEventCategoryDTO
  ) {
    console.log("UPDATE_CATEGORY DEBUG:", { id, churchId });

    return prisma.$transaction(async (tx) => {
      const existing = await tx.eventCategory.findUnique({
        where: { id },
        select: { id: true, name: true, churchId: true },
      });

      console.log("EXISTING:", existing);

      if (!existing) throw new Error("CATEGORY_NOT_FOUND");
      if (existing.churchId !== churchId) throw new Error("CATEGORY_NOT_FOUND");

      const updated = await tx.eventCategory.update({
        where: { id },
        data: { name: data.name },
        select: { id: true, name: true },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "UPDATE_EVENT_CATEGORY",
          entityName: "EventCategory",
          entityId: id,
          oldData: { name: existing.name },
          newData: { name: data.name },
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
      const existing = await tx.eventCategory.findUnique({
        where: { id },
        select: { id: true, name: true, churchId: true, _count: { select: { events: true } } },
      });

      if (!existing) throw new Error("CATEGORY_NOT_FOUND");
      if (existing.churchId !== churchId) throw new Error("CATEGORY_NOT_FOUND");

      // 🔒 Não apaga se tiver eventos associados
      if (existing._count.events > 0)
        throw new Error("CATEGORY_HAS_EVENTS");

      await tx.eventCategory.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "DELETE_EVENT_CATEGORY",
          entityName: "EventCategory",
          entityId: id,
          oldData: { name: existing.name },
        },
      });
    });
  },
};