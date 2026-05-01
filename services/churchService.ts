import prisma from "@/lib/prisma";

export const ChurchService = {
  async updateSettings(
    churchId: string,
    actor: { userId: string; email: string }, // 👈 adiciona actor
    data: { name: string; timezone: string }
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.church.findUnique({
        where: { id: churchId },
        select: { name: true, timezone: true },
      });

      // 👈 early return se nada mudou
    if (existing?.name === data.name && existing?.timezone === data.timezone) {
      return existing;
    }

      const updated = await tx.church.update({
        where: { id: churchId },
        data: { name: data.name, timezone: data.timezone },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "UPDATE_CHURCH_SETTINGS",
          entityName: "Church",
          entityId: churchId,
          oldData: { name: existing?.name, timezone: existing?.timezone },
          newData: { name: data.name, timezone: data.timezone },
        },
      });

      return updated;
    });
  },
};