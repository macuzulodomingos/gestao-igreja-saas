import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";

export interface CreateRoleDTO {
  name: string;
}

export const MemberRoleService = {

  async getRoles(churchId: string) {
    return await prisma.memberRole.findMany({
      where: { churchId },
      include: { _count: { select: { members: true } } },
      orderBy: { name: "asc" },
    });
  },

  async createRole(
    churchId: string,
    actor: { userId: string; email: string },
    data: CreateRoleDTO
  ) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.memberRole.findFirst({
        where: { churchId, name: data.name },
      });

      if (existing) throw new Error("Já existe um cargo com este nome.");

      const role = await tx.memberRole.create({
        data: { name: data.name, churchId },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "CREATE_ROLE",
          entityName: "MemberRole",
          entityId: role.id,
          newData: role as unknown as Prisma.InputJsonValue,
        },
      });

      return role;
    });
  },

  async updateRole(
    id: string,
    churchId: string,
    actor: { userId: string; email: string },
    data: CreateRoleDTO
  ) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.memberRole.findFirst({
        where: { id, churchId },
      });

      if (!existing) throw new Error("Cargo não encontrado ou acesso negado.");

      const duplicate = await tx.memberRole.findFirst({
        where: { churchId, name: data.name, NOT: { id } },
      });

      if (duplicate) throw new Error("Já existe um cargo com este nome.");

      const updated = await tx.memberRole.update({
        where: { id },
        data: { name: data.name },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "UPDATE_ROLE",
          entityName: "MemberRole",
          entityId: id,
          oldData: existing as unknown as Prisma.InputJsonValue,
          newData: updated as unknown as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  },

  async deleteRole(
    id: string,
    churchId: string,
    actor: { userId: string; email: string }
  ) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.memberRole.findFirst({
        where: { id, churchId },
        include: { _count: { select: { members: true } } },
      });

      if (!existing) throw new Error("Cargo não encontrado ou acesso negado.");

      if (existing._count.members > 0) {
        throw new Error(
          `Não é possível eliminar: este cargo tem ${existing._count.members} membro(s) associado(s).`
        );
      }

      await tx.memberRole.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "DELETE_ROLE",
          entityName: "MemberRole",
          entityId: id,
          oldData: existing as unknown as Prisma.InputJsonValue,
        },
      });

      return { success: true };
    });
  },
};