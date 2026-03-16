import prisma from "@/lib/prisma";

export const SuperAdminService = {
  async getGlobalStats() {
    const [
      totalChurches,
      totalMembers,
      totalUsers,
      totalTransactions,
      churchesByPlan,
    ] = await Promise.all([
      prisma.church.count(),
      prisma.member.count(),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.financeTransaction.count(),
      prisma.church.groupBy({
        by: ["plan"],
        _count: { id: true },
      }),
    ]);

    const planCounts = {
      FREE: churchesByPlan.find(p => p.plan === "FREE")?._count.id ?? 0,
      PRO: churchesByPlan.find(p => p.plan === "PRO")?._count.id ?? 0,
      ENTERPRISE: churchesByPlan.find(p => p.plan === "ENTERPRISE")?._count.id ?? 0,
    };

    return {
      totalChurches,
      totalMembers,
      totalUsers,
      totalTransactions,
      planCounts,
    };
  },

  async getChurches(page = 1, limit = 20, search?: string) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [churches, total] = await Promise.all([
      prisma.church.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          createdAt: true,
          _count: {
            select: {
              members: true,
              users: true,
              finances: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.church.count({ where }),
    ]);

    return {
      churches,
      metadata: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  },

  async updateChurchPlan(churchId: string, plan: "FREE" | "PRO" | "ENTERPRISE") {
    return prisma.church.update({
      where: { id: churchId },
      data: { plan },
      select: { id: true, name: true, plan: true },
    });
  },
};