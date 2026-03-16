import prisma from "@/lib/prisma";

export interface AuditFilters {
  entityName?: string;
  action?: string;
  page?: number;
  limit?: number;
}

export const AuditService = {
  async getChurchLogs(churchId: string, filters: AuditFilters = {}) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(50, filters.limit ?? 20);

    const where = {
      churchId,
      ...(filters.entityName && { entityName: filters.entityName }),
      ...(filters.action && { action: { contains: filters.action, mode: "insensitive" as const, } }),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      metadata: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        hasNext: page < Math.ceil(total / limit), // 👈 AMBOS
      },
    };
  },
};