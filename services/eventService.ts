import prisma from "@/lib/prisma";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export interface CreateEventDTO {
  name: string;
  description?: string;
  categoryId: string;  // 👈 substitui type
  startAt: Date;        // 👈 substitui date + time
  departmentId?: string;
}

export const EventService = {

  async getEvents(churchId: string, timezone: string, month: number, year: number) {
    const startOfMonth = fromZonedTime(
      `${year}-${String(month).padStart(2, "0")}-01T00:00:00`,
      timezone
    );
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextMonthYear = month === 12 ? year + 1 : year;
    const endOfMonth = fromZonedTime(
      `${nextMonthYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00`,
      timezone
    );

    return prisma.event.findMany({
      where: {
        churchId,
        startAt: { gte: startOfMonth, lt: endOfMonth },
      },
      select: {
        id: true,
        name: true,
        description: true,
        categoryId: true,
        category: { select: { id: true, name: true } },
        startAt: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
        _count: { select: { attendees: true } },
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
      const category = await tx.eventCategory.findFirst({
        where: { id: data.categoryId, churchId },
        select: { name: true },
      });
      if (!category) throw new Error("INVALID_CATEGORY");

      let departmentName: string | null = null;
      if (data.departmentId) {
        const dept = await tx.department.findFirst({
          where: { id: data.departmentId, churchId },
          select: { name: true },
        });
        if (!dept) throw new Error("INVALID_DEPARTMENT");
        departmentName = dept.name;
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
            department: departmentName ?? null,
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
        select: {
          id: true, name: true, startAt: true, churchId: true,
          category: { select: { name: true } },           // 👈
          department: { select: { name: true } },          // 👈
        },
      });

      if (!existing) throw new Error("EVENT_NOT_FOUND");
      if (existing.churchId !== churchId) throw new Error("EVENT_NOT_FOUND");

      // 🔒 Verifica que a categoria pertence à igreja
      const category = await tx.eventCategory.findFirst({
        where: { id: data.categoryId, churchId },
        select: { name: true },
      });
      if (!category) throw new Error("INVALID_CATEGORY");

      let departmentName: string | null = null;
      if (data.departmentId) {
        const dept = await tx.department.findFirst({
          where: { id: data.departmentId, churchId }, // 👈 Segurança direto no banco
          select: { name: true }
        });
        if (!dept) throw new Error("INVALID_DEPARTMENT");
        departmentName = dept.name;
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
          oldData: {
            name: existing.name,
            category: existing.category?.name ?? null,    // 👈
            startAt: existing.startAt,
            department: existing.department?.name ?? null, // 👈
          },
          newData: {
            name: data.name,
            category: category.name,                      // 👈
            startAt: data.startAt,
            department: departmentName,                   // 👈
          },
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
        select: {
          id: true, name: true, churchId: true,
          category: { select: { name: true } },  // 👈
        },
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
          oldData: {
            name: existing.name,
            category: existing.category?.name ?? null, // 👈
          },
        },
      });
    });
  },


  async getEventAttendees(eventId: string, churchId: string) {
    return prisma.eventAttendee.findMany({
      where: { eventId, event: { churchId } },
      select: {
        member: { select: { id: true, name: true, role: { select: { name: true } } } },
      },
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

      const uniqueMemberIds = [...new Set(memberIds)];

      // 👈 busca presenças actuais para fazer o diff
      const currentAttendees = await tx.eventAttendee.findMany({
        where: { eventId },
        select: { memberId: true },
      });
      const currentIds = currentAttendees.map(a => a.memberId);

      const toAdd = uniqueMemberIds.filter(id => !currentIds.includes(id));
      const toRemove = currentIds.filter(id => !uniqueMemberIds.includes(id));

      // 👈 valida apenas os novos membros
      if (toAdd.length > 0) {
        const validCount = await tx.member.count({
          where: { id: { in: toAdd }, churchId },
        });
        if (validCount !== toAdd.length)
          throw new Error("INVALID_MEMBERS");

        await tx.eventAttendee.createMany({
          data: toAdd.map(memberId => ({ eventId, memberId })),
        });
      }

      // 👈 remove apenas quem saiu
      if (toRemove.length > 0) {
        await tx.eventAttendee.deleteMany({
          where: { eventId, memberId: { in: toRemove } },
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
          newData: { memberIds: uniqueMemberIds },
        },
      });
    });
  },
};