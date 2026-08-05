import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const ProfileService = {
  async updateName(userId: string, name: string, actor: { userId: string; email: string }) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { name },
        select: { id: true, name: true },
      });

      await tx.auditLog.create({
        data: {
          churchId: null,
          userId: actor.userId,
          userEmail: actor.email,
          action: "UPDATE_PROFILE",
          entityName: "User",
          entityId: userId,
          newData: { name },
        },
      });

      return updated;
    });
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    actor: { userId: string; email: string }
  ) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!dbUser || !dbUser.password) {
      throw new Error("USER_NOT_FOUND");
    }

    const currentPasswordMatch = await bcrypt.compare(currentPassword, dbUser.password);
    if (!currentPasswordMatch) {
      throw new Error("WRONG_CURRENT_PASSWORD");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      await tx.auditLog.create({
        data: {
          churchId: null,
          userId: actor.userId,
          userEmail: actor.email,
          action: "CHANGE_PASSWORD",
          entityName: "User",
          entityId: userId,
          newData: { via: "profile_settings" },
        },
      });
    });
  },
};