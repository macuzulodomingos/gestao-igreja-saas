import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role: "TREASURER" | "SECRETARY" | "OPERATOR";
}

export interface UpdateUserDTO {
  name?: string;
  role?: "TREASURER" | "SECRETARY" | "OPERATOR";
}

export const UserService = {
  async getUsers(churchId: string) {
    return prisma.user.findMany({
      where: { churchId, deletedAt: null }, // 👈 só activos
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
  },

  async createUser(
    churchId: string,
    actor: { userId: string; email: string },
    data: CreateUserDTO
  ) {
    const hashedPassword = await bcrypt.hash(data.password, 12);

    return prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: data.role,
          churchId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "CREATE_USER",
          entityName: "User",
          entityId: newUser.id,
          newData: { name: data.name, email: data.email, role: data.role },
        },
      });

      return newUser;
    });
  },

  async updateUser(
    userId: string,
    churchId: string,
    actor: { userId: string; email: string },
    data: UpdateUserDTO
  ) {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ // 👈 usa tx
        where: { id: userId },
        select: { id: true, name: true, role: true, email: true, churchId: true, deletedAt: true },
      });

      if (!existing) throw new Error("USER_NOT_FOUND");
      if (existing.deletedAt) throw new Error("USER_NOT_FOUND");
      if (existing.churchId !== churchId) throw new Error("USER_NOT_FOUND");
      if (existing.id === actor.userId) throw new Error("CANNOT_EDIT_SELF");

      await tx.user.update({
        where: { id: userId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.role && { role: data.role }),
        },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "UPDATE_USER",
          entityName: "User",
          entityId: userId,
          oldData: { name: existing.name, role: existing.role },
          newData: { name: data.name ?? existing.name, role: data.role ?? existing.role },
        },
      });
    });
  },

  async deleteUser(
    userId: string,
    churchId: string,
    actor: { userId: string; email: string }
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ // 👈 dentro da transacção
        where: { id: userId },
        select: { id: true, name: true, role: true, email: true, churchId: true, deletedAt: true },
      });

      if (!existing) throw new Error("USER_NOT_FOUND");
      if (existing.deletedAt) throw new Error("USER_NOT_FOUND");
      if (existing.churchId !== churchId) throw new Error("USER_NOT_FOUND");
      if (existing.id === actor.userId) throw new Error("CANNOT_DELETE_SELF");
      if (existing.role === "ADMIN") throw new Error("CANNOT_DELETE_ADMIN");

      // 🔒 Nunca apagar o último SUPER_ADMIN
      if (existing.role === "SUPER_ADMIN") {
        const count = await tx.user.count({ // 👈 usa tx
          where: { role: "SUPER_ADMIN", deletedAt: null },
        });
        if (count <= 1) throw new Error("CANNOT_DELETE_LAST_SUPER_ADMIN");
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          email: `deleted_${Date.now()}_${existing.email}`, // 👈 liberta o email original
        },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "DELETE_USER",
          entityName: "User",
          entityId: userId,
          oldData: { name: existing.name, email: existing.email, role: existing.role },
        },
      });
    });
  },
  

  // services/userService.ts
  async updateLocale(userId: string, locale: "pt" | "fr") {
    return prisma.user.update({
      where: { id: userId },
      data: { locale },
      select: { id: true, locale: true },
    });
  },

};