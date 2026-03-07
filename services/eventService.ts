import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";

type EventType = "SERVICO" | "REUNIAO" | "ENSAIO" | "CONFERENCIA" | "OUTRO";

export interface CreateEventDTO {
  name: string;
  description?: string;
  type: EventType;
  date: Date;
  time: string;
  departmentId?: string;
}

export const EventService = {

  async getEvents(churchId: string) {
    return await prisma.event.findMany({
      where: { churchId },
      include: {
        department: true,
        attendees: { include: { member: true } },
      },
      orderBy: { date: "asc" },
    });
  },

  async createEvent(
    churchId: string,
    actor: { userId: string; email: string },
    data: CreateEventDTO
  ) {
    return await prisma.$transaction(async (tx) => {
      if (data.departmentId) {
        const dept = await tx.department.findFirst({
          where: { id: data.departmentId, churchId },
        });
        if (!dept) throw new Error("Departamento inválido para esta igreja.");
      }

      const event = await tx.event.create({
        data: {
          name: data.name,
          description: data.description || null,
          type: data.type,
          date: data.date,
          time: data.time,
          departmentId: data.departmentId || null,
          churchId,
        },
        include: { department: true },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "CREATE_EVENT",
          entityName: "Event",
          entityId: event.id,
          newData: event as unknown as Prisma.InputJsonValue,
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
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.event.findFirst({ where: { id, churchId } });
      if (!existing) throw new Error("Evento não encontrado ou acesso negado.");

      if (data.departmentId) {
        const dept = await tx.department.findFirst({
          where: { id: data.departmentId, churchId },
        });
        if (!dept) throw new Error("Departamento inválido para esta igreja.");
      }

      const updated = await tx.event.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description || null,
          type: data.type,
          date: data.date,
          time: data.time,
          departmentId: data.departmentId || null,
        },
        include: { department: true },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "UPDATE_EVENT",
          entityName: "Event",
          entityId: id,
          oldData: existing as unknown as Prisma.InputJsonValue,
          newData: updated as unknown as Prisma.InputJsonValue,
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
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.event.findFirst({ where: { id, churchId } });
      if (!existing) throw new Error("Evento não encontrado ou acesso negado.");

      await tx.event.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "DELETE_EVENT",
          entityName: "Event",
          entityId: id,
          oldData: existing as unknown as Prisma.InputJsonValue,
        },
      });

      return { success: true };
    });
  },

  async syncAttendees(
    eventId: string,
    churchId: string,
    memberIds: string[],
    actor: { userId: string; email: string }
  ) {
    return await prisma.$transaction(async (tx) => {
      const event = await tx.event.findFirst({ where: { id: eventId, churchId } });
      if (!event) throw new Error("Evento não encontrado ou acesso negado.");

      if (memberIds.length > 0) {
        const validMembers = await tx.member.count({
          where: { id: { in: memberIds }, churchId },
        });
        if (validMembers !== memberIds.length) {
          throw new Error("Um ou mais membros são inválidos.");
        }
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
          newData: { memberIds } as unknown as Prisma.InputJsonValue,
        },
      });

      return { success: true };
    });
  },
};