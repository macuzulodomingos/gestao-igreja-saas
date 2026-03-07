import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface CreateDepartmentDTO {
  name: string;
  description?: string;
  leaderId?: string;
}

export const DepartmentService = {

  async getDepartments(churchId: string) {
    return await prisma.department.findMany({
      where: { churchId },
      include: {
        leader: { include: { role: true } },
        members: { include: { member: { include: { role: true } } } }, // 👈 NOVO
      },
      orderBy: { name: "asc" },
    });
  },

  async createDepartment(
    churchId: string,
    actor: { userId: string; email: string },
    data: CreateDepartmentDTO
  ) {
    return await prisma.$transaction(async (tx) => {
      if (data.leaderId) {
        const leader = await tx.member.findFirst({
          where: { id: data.leaderId, churchId },
        });
        if (!leader) throw new Error("Líder inválido para esta igreja.");
      }

      const department = await tx.department.create({
        data: {
          name: data.name,
          description: data.description || null,
          leaderId: data.leaderId || null,
          churchId,
        },
        include: { leader: true },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "CREATE_DEPARTMENT",
          entityName: "Department",
          entityId: department.id,
          newData: department as unknown as Prisma.InputJsonValue,
        },
      });

      return department;
    });
  },

  async updateDepartment(
    id: string,
    churchId: string,
    actor: { userId: string; email: string },
    data: CreateDepartmentDTO
  ) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.department.findFirst({
        where: { id, churchId },
      });
      if (!existing) throw new Error("Departamento não encontrado ou acesso negado.");

      if (data.leaderId) {
        const leader = await tx.member.findFirst({
          where: { id: data.leaderId, churchId },
        });
        if (!leader) throw new Error("Líder inválido para esta igreja.");
      }

      const updated = await tx.department.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description || null,
          leaderId: data.leaderId || null,
        },
        include: { leader: true },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "UPDATE_DEPARTMENT",
          entityName: "Department",
          entityId: id,
          oldData: existing as unknown as Prisma.InputJsonValue,
          newData: updated as unknown as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  },

  async deleteDepartment(
    id: string,
    churchId: string,
    actor: { userId: string; email: string }
  ) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.department.findFirst({
        where: { id, churchId },
      });
      if (!existing) throw new Error("Departamento não encontrado ou acesso negado.");

      await tx.department.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "DELETE_DEPARTMENT",
          entityName: "Department",
          entityId: id,
          oldData: existing as unknown as Prisma.InputJsonValue,
        },
      });

      return { success: true };
    });
  },

  // 👇 NOVO — Sincroniza membros do departamento
  async syncDepartmentMembers(
    departmentId: string,
    churchId: string,
    memberIds: string[],
    actor: { userId: string; email: string }
  ) {
    return await prisma.$transaction(async (tx) => {
      // 🔒 Verifica que o departamento pertence à igreja
      const department = await tx.department.findFirst({
        where: { id: departmentId, churchId },
      });
      if (!department) throw new Error("Departamento não encontrado ou acesso negado.");

      // 🔒 Verifica que todos os membros pertencem à mesma igreja
      if (memberIds.length > 0) {
        const validMembers = await tx.member.count({
          where: { id: { in: memberIds }, churchId },
        });
        if (validMembers !== memberIds.length) {
          throw new Error("Um ou mais membros são inválidos para esta igreja.");
        }
      }

      // Remove todos os membros actuais e insere os novos (sync completo)
      await tx.departmentMember.deleteMany({
        where: { departmentId },
      });

      if (memberIds.length > 0) {
        await tx.departmentMember.createMany({
          data: memberIds.map(memberId => ({ departmentId, memberId })),
        });
      }

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "SYNC_DEPARTMENT_MEMBERS",
          entityName: "Department",
          entityId: departmentId,
          newData: { memberIds } as unknown as Prisma.InputJsonValue,
        },
      });

      return { success: true };
    });
  },
};