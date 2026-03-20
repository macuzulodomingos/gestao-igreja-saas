import prisma from "@/lib/prisma";

export interface AuditFilters {
  entityName?: string;
  action?: string;
  page?: number;
  limit?: number;
}

export const AuditService = {
  async getChurchLogs(churchId: string | null, filters: AuditFilters = {}) {
    // 🔒 Última linha de defesa — nunca deve chegar aqui em condições normais
    if (churchId === undefined || (churchId as unknown) === "") {
      throw new Error("SECURITY_BREACH: churchId inválido");
    }

    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(50, filters.limit ?? 20);

    const where = {
      churchId,
      ...(filters.entityName && { entityName: filters.entityName }),
      ...(filters.action && {
        action: { contains: filters.action, mode: "insensitive" as const },
      }),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          entityName: true,
          entityId: true,
          userEmail: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit); // 👈 calcula uma vez

    return {
      logs,
      metadata: {
        total,
        totalPages,
        currentPage: page,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },
};