import prisma from "@/lib/prisma";

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

      if (existing) throw new Error("ROLE_DUPLICATE"); // 👈 era "Já existe um cargo com este nome."

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
          newData: { name: role.name }, // 👈 era role as unknown as Prisma.InputJsonValue
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
      const existing = await tx.memberRole.findUnique({ // 👈 era findFirst
        where: { id },
        select: { id: true, name: true, churchId: true }, // 👈 select explícito
      });

      if (!existing || existing.churchId !== churchId) // 👈 verifica churchId separadamente
        throw new Error("ROLE_NOT_FOUND"); // 👈 era "Cargo não encontrado ou acesso negado."

      const duplicate = await tx.memberRole.findFirst({
        where: { churchId, name: data.name, NOT: { id } },
      });

      if (duplicate) throw new Error("ROLE_DUPLICATE"); // 👈 era "Já existe um cargo com este nome."

      const updated = await tx.memberRole.update({
        where: { id },
        data: { name: data.name },
        select: { id: true, name: true }, // 👈 select explícito
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "UPDATE_ROLE",
          entityName: "MemberRole",
          entityId: id,
          oldData: { name: existing.name }, // 👈 era existing as unknown as Prisma.InputJsonValue
          newData: { name: updated.name },  // 👈 era updated as unknown as Prisma.InputJsonValue
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
      const existing = await tx.memberRole.findUnique({ // 👈 era findFirst
        where: { id },
        select: { // 👈 select explícito em vez de include
          id: true,
          name: true,
          churchId: true,
          _count: { select: { members: true } },
        },
      });

      if (!existing || existing.churchId !== churchId) // 👈 verifica churchId separadamente
        throw new Error("ROLE_NOT_FOUND"); // 👈 era "Cargo não encontrado ou acesso negado."

      if (existing._count.members > 0)
        throw new Error("ROLE_HAS_MEMBERS"); // 👈 era mensagem longa com interpolação

      await tx.memberRole.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "DELETE_ROLE",
          entityName: "MemberRole",
          entityId: id,
          oldData: { name: existing.name }, // 👈 era existing as unknown as Prisma.InputJsonValue
        },
      });

      return { success: true };
    });
  },
};