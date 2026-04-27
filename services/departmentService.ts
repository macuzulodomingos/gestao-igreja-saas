import prisma from "@/lib/prisma";
import { getDiff } from "@/lib/utils";

export interface CreateDepartmentDTO {
  name: string;
  description?: string;
  leaderId?: string | null;
}

type UpdateDepartmentDTO = {
  name?: string;
  description?: string;
  leaderId?: string | null;
};


export const DepartmentService = {

  async getDepartments(churchId: string) {
    if (!churchId) return [];
    return prisma.department.findMany({
      where: { churchId },
      select: {
        id: true,
        name: true,
        description: true,
        leaderId: true,
        leader: {
          select: {
            id: true,
            name: true,
            role: { select: { name: true } },
          },
        },
        members: {
          select: {
            member: {
              select: {
                id: true,
                name: true,
                role: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });
  },

  async createDepartment(
    churchId: string,
    actor: { userId: string; email: string },
    data: CreateDepartmentDTO
  ) {
    return prisma.$transaction(async (tx) => {
      let leaderName: string | null = null;

      if (data.leaderId) {
        const leader = await tx.member.findUnique({
          where: { id: data.leaderId },
          select: { id: true, name: true, churchId: true },
        });
        if (!leader || leader.churchId !== churchId)
          throw new Error("INVALID_LEADER");
        leaderName = leader.name;
      }

      const department = await tx.department.create({
        data: {
          name: data.name,
          description: data.description?.trim() || null,
          leaderId: data.leaderId || null,
          churchId,
        },
        select: { id: true, name: true, description: true, leaderId: true },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "CREATE_DEPARTMENT",
          entityName: "Department",
          entityId: department.id,
          newData: { name: data.name, leader: leaderName },
        },
      });

      return department;
    });
  },

  async updateDepartment(
    id: string,
    churchId: string,
    actor: { userId: string; email: string },
    data: UpdateDepartmentDTO
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.department.findUnique({
        where: { id },
        select: { id: true, name: true, description: true, churchId: true, leaderId: true },
      });

      if (!existing) throw new Error("DEPARTMENT_NOT_FOUND");
      if (existing.churchId !== churchId) throw new Error("DEPARTMENT_NOT_FOUND");

      if (data.leaderId) {
        const leader = await tx.member.findUnique({
          where: { id: data.leaderId },
          select: { id: true, churchId: true },
        });
        if (!leader || leader.churchId !== churchId)
          throw new Error("INVALID_LEADER");
      }

      const updated = await tx.department.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && {
            description: data.description?.trim() || null,
          }),
          ...(data.leaderId !== undefined && {
            leaderId: data.leaderId || null,
          }),
        },
        select: { id: true, name: true, description: true, leaderId: true },
      });

      const changes = getDiff(
        { id: existing.id, name: existing.name, description: existing.description, leaderId: existing.leaderId },
        updated
      );

      // Só grava o log se houver alguma diferença real
      if (Object.keys(changes.new).length > 0) {
        await tx.auditLog.create({
          data: {
            churchId,
            userId: actor.userId,
            userEmail: actor.email,
            action: "UPDATE_DEPARTMENT",
            entityName: "Department",
            entityId: id,
            oldData: changes.old, // Ex: { name: "Antigo" }
            newData: changes.new, // Ex: { name: "Novo" }
          },
        });
      }

      return updated;
    });
  },

  async deleteDepartment(
    id: string,
    churchId: string,
    actor: { userId: string; email: string }
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.department.findUnique({
        where: { id },
        select: { id: true, name: true, churchId: true },
      });

      if (!existing) throw new Error("DEPARTMENT_NOT_FOUND");
      if (existing.churchId !== churchId) throw new Error("DEPARTMENT_NOT_FOUND");

      await tx.department.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "DELETE_DEPARTMENT",
          entityName: "Department",
          entityId: id,
          oldData: { name: existing.name },
        },
      });
    });
  },

  async syncDepartmentMembers(
    departmentId: string,
    churchId: string,
    memberIds: string[],
    actor: { userId: string; email: string }
  ) {
    return prisma.$transaction(async (tx) => {
      const department = await tx.department.findUnique({
        where: { id: departmentId },
        select: { id: true, churchId: true },
      });

      if (!department) throw new Error("DEPARTMENT_NOT_FOUND");
      if (department.churchId !== churchId) throw new Error("DEPARTMENT_NOT_FOUND");

      if (memberIds.length > 0) {
        const validMembers = await tx.member.count({
          where: { id: { in: memberIds }, churchId },
        });
        if (validMembers !== memberIds.length)
          throw new Error("INVALID_MEMBERS");
      }

      const uniqueMemberIds = [...new Set(memberIds)];

      const current = await tx.departmentMember.findMany({
        where: { departmentId },
        select: { memberId: true },
      });
      const currentIds = current.map(m => m.memberId);

      const toAdd = uniqueMemberIds.filter(id => !currentIds.includes(id));
      const toRemove = currentIds.filter(id => !uniqueMemberIds.includes(id));

      if (toAdd.length > 0) {
        const validCount = await tx.member.count({
          where: { id: { in: toAdd }, churchId },
        });
        if (validCount !== toAdd.length) throw new Error("INVALID_MEMBERS");

        await tx.departmentMember.createMany({
          data: toAdd.map(memberId => ({ departmentId, memberId })),
        });
      }

      if (toRemove.length > 0) {
        await tx.departmentMember.deleteMany({
          where: { departmentId, memberId: { in: toRemove } },
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
          newData: { memberIds },
        },
      });
    });
  },
};