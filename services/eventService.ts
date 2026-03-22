import prisma from "@/lib/prisma";

export interface CreateEventDTO {
  name: string;
  description?: string;
  categoryId: string;  // 👈 substitui type
  startAt: Date;        // 👈 substitui date + time
  departmentId?: string;
}

export const EventService = {

  async getEvents(churchId: string) {
    return prisma.event.findMany({
      where: { churchId },
      select: {
        id: true,
        name: true,
        description: true,
        categoryId: true,           // 👈
        category: { select: { id: true, name: true } }, // 👈
        startAt: true,  // 👈
        departmentId: true,
        department: { select: { id: true, name: true } },
        attendees: {
          select: {
            member: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { startAt: "asc" },
    });
  },

  async createEvent(
    churchId: string,
    actor: { userId: string; email: string },
    data: CreateEventDTO
  ) {
    return prisma.$transaction(async (tx) => {
      // 🔒 Verifica que a categoria pertence à igreja
      const category = await tx.eventCategory.findUnique({
        where: { id: data.categoryId },
        select: { id: true, name: true, churchId: true },
      });
      if (!category || category.churchId !== churchId)
        throw new Error("INVALID_CATEGORY");

      if (data.departmentId) {
        const dept = await tx.department.findUnique({
          where: { id: data.departmentId },
          select: { id: true, churchId: true },
        });
        if (!dept || dept.churchId !== churchId)
          throw new Error("INVALID_DEPARTMENT");
      }

      const event = await tx.event.create({
        data: {
          name: data.name,
          description: data.description || null,
          categoryId: data.categoryId, // 👈
          startAt: data.startAt, // 👈
          departmentId: data.departmentId || null,
          churchId,
        },
        select: { id: true, name: true, categoryId: true, startAt: true },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "CREATE_EVENT",
          entityName: "Event",
          entityId: event.id,
          newData: {
            name: data.name,
            category: category.name,
            startAt: data.startAt,
            departmentId: data.departmentId ?? null,
          },
        },
      });

      return event;
    });
  },

  async updateEvent(
    id: string,
    churchId: string,
    actor: { userId: string; email: string },
    data: CreateEventDTO
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.event.findUnique({
        where: { id },
        select: { id: true, name: true, categoryId: true, startAt: true, churchId: true },
      });

      if (!existing) throw new Error("EVENT_NOT_FOUND");
      if (existing.churchId !== churchId) throw new Error("EVENT_NOT_FOUND");

      // 🔒 Verifica que a categoria pertence à igreja
      const category = await tx.eventCategory.findUnique({
        where: { id: data.categoryId },
        select: { id: true, name: true, churchId: true },
      });
      if (!category || category.churchId !== churchId)
        throw new Error("INVALID_CATEGORY");

      if (data.departmentId) {
        const dept = await tx.department.findUnique({
          where: { id: data.departmentId },
          select: { id: true, churchId: true },
        });
        if (!dept || dept.churchId !== churchId)
          throw new Error("INVALID_DEPARTMENT");
      }

      const updated = await tx.event.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description || null,
          categoryId: data.categoryId, // 👈
          startAt: data.startAt, // 👈
          departmentId: data.departmentId || null,
        },
        select: { id: true, name: true, categoryId: true, startAt: true },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "UPDATE_EVENT",
          entityName: "Event",
          entityId: id,
          oldData: { name: existing.name, categoryId: existing.categoryId, startAt: existing.startAt },
          newData: { name: data.name, categoryId: data.categoryId, startAt: data.startAt },
        },
      });

      return updated;
    });
  },

  async deleteEvent(
    id: string,
    churchId: string,
    actor: { userId: string; email: string }
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.event.findUnique({
        where: { id },
        select: { id: true, name: true, categoryId: true, churchId: true },
      });

      if (!existing) throw new Error("EVENT_NOT_FOUND");
      if (existing.churchId !== churchId) throw new Error("EVENT_NOT_FOUND");

      await tx.event.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "DELETE_EVENT",
          entityName: "Event",
          entityId: id,
          oldData: { name: existing.name, categoryId: existing.categoryId },
        },
      });
    });
  },

  async syncAttendees(
    eventId: string,
    churchId: string,
    memberIds: string[],
    actor: { userId: string; email: string }
  ) {
    return prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: { id: true, churchId: true },
      });

      if (!event) throw new Error("EVENT_NOT_FOUND");
      if (event.churchId !== churchId) throw new Error("EVENT_NOT_FOUND");

      if (memberIds.length > 0) {
        const validMembers = await tx.member.count({
          where: { id: { in: memberIds }, churchId },
        });
        if (validMembers !== memberIds.length)
          throw new Error("INVALID_MEMBERS");
      }

      await tx.eventAttendee.deleteMany({ where: { eventId } });

      if (memberIds.length > 0) {
        await tx.eventAttendee.createMany({
          data: memberIds.map(memberId => ({ eventId, memberId })),
        });
      }

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "SYNC_EVENT_ATTENDEES",
          entityName: "Event",
          entityId: eventId,
          newData: { memberIds },
        },
      });
    });
  },
};