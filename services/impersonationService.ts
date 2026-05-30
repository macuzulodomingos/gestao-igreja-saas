import prisma from "@/lib/prisma";

export const ImpersonationService = {
  async startImpersonation(
    superAdminId: string,
    churchId: string,
    reason: string
  ) {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    return prisma.$transaction(async (tx) => {
      // Fecha sessões activas anteriores para a mesma church
      await tx.impersonationSession.updateMany({
        where: {
          superAdminId,
          churchId,
          endedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { endedAt: new Date() },
      });

      const session = await tx.impersonationSession.create({
        data: { superAdminId, churchId, reason, expiresAt },
        select: { id: true, expiresAt: true },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: superAdminId,
          action: "IMPERSONATION_START",
          entityName: "Church",
          entityId: churchId,
          newData: { reason, expiresAt, sessionId: session.id },
        },
      });

      return session;
    });
  },

  async endImpersonationBySlug(superAdminId: string, slug: string) {
    // Busca sessão aberta mesmo que já tenha expirado pelo tempo
    const session = await prisma.impersonationSession.findFirst({
      where: {
        superAdminId,
        endedAt: null,
        church: { slug },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, churchId: true },
    });

    if (!session) return false;

    // Atómico — só fecha se ainda estiver aberta
    const updated = await prisma.impersonationSession.updateMany({
      where: {
        id: session.id,
        superAdminId,
        endedAt: null,
      },
      data: { endedAt: new Date() },
    });

    if (updated.count === 0) return false;

    await prisma.auditLog.create({
      data: {
        churchId: session.churchId,
        userId: superAdminId,
        action: "IMPERSONATION_END",
        entityName: "Church",
        entityId: session.churchId,
        newData: { sessionId: session.id },
      },
    });

    return true;
  },

  async getActiveSession(superAdminId: string, churchId: string) {
    return prisma.impersonationSession.findFirst({
      where: {
        superAdminId,
        churchId,
        endedAt: null,
        expiresAt: { gt: new Date() },
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
        church: { slug },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, churchId: true, reason: true, expiresAt: true },
    });
  },
};