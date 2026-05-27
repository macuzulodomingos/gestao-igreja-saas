import prisma from "@/lib/prisma";

export const ImpersonationService = {
  async startImpersonation(
    superAdminId: string,
    churchId: string,
    reason: string
  ) {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    const session = await prisma.impersonationSession.create({
      data: {
        superAdminId,
        churchId,
        reason,
        expiresAt,
      },
      select: { id: true, expiresAt: true },
    });

    await prisma.auditLog.create({
      data: {
        churchId,
        userId: superAdminId,
        action: "IMPERSONATION_START",
        entityName: "Church",
        entityId: churchId,
        newData: { reason, expiresAt },
      },
    });

    return session;
  },

  async endImpersonation(sessionId: string, superAdminId: string) {
    const session = await prisma.impersonationSession.findUnique({
      where: { id: sessionId },
      select: { churchId: true, superAdminId: true },
    });

    if (!session || session.superAdminId !== superAdminId)
      throw new Error("IMPERSONATION_NOT_FOUND");

    await prisma.$transaction(async (tx) => {
      await tx.impersonationSession.update({
        where: { id: sessionId },
        data: { endedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          churchId: session.churchId,
          userId: superAdminId,
          action: "IMPERSONATION_END",
          entityName: "Church",
          entityId: session.churchId,
          newData: { sessionId },
        },
      });
    });
  },

  async getActiveSession(superAdminId: string, churchId: string) {
    return prisma.impersonationSession.findFirst({
      where: {
        superAdminId,
        churchId,
        endedAt: null,
        expiresAt: { gt: new Date() }, // 👈 não expirada
      },
      select: { id: true, reason: true, expiresAt: true },
    });
  },

  async isImpersonating(superAdminId: string, slug: string) {
    return prisma.impersonationSession.findFirst({
      where: {
        superAdminId,
        endedAt: null,
        expiresAt: { gt: new Date() },
        church: { slug }, // 👈 filtra pela church com este slug
      },
      orderBy: {
        createdAt: "desc", // 👈 sempre a sessão mais recente
      },
      select: { id: true, churchId: true, reason: true, expiresAt: true },
    });
  },
};