import { PlanType } from "@/lib/plans";
import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export type GlobalStats = Awaited<ReturnType<typeof SuperAdminService.getGlobalStats>>;

export const SuperAdminService = {

  getGlobalStats: unstable_cache(
    async () => {
      const [totalChurches, totalMembers, totalUsers, totalTransactions, churchesByPlan] =
        await Promise.all([
          prisma.church.count(),
          prisma.member.count({ where: { deletedAt: null } }),
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
    ["global-stats"],
    { revalidate: 600, tags: ["admin-stats"] } // 👈 10 minutos
  ),


  async getChurches(page = 1, limit = 20, search?: string) {

    const safePage = Math.max(1, page);           
    const safeLimit = Math.min(limit, 100);

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
          users: { // 👈 busca o admin principal
            where: { role: "ADMIN", deletedAt: null },
            select: { email: true, name: true },
            take: 1,
          },
          _count: {
            select: {
              members: { where: { deletedAt: null } },
              users: true,
              finances: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      prisma.church.count({ where }),
    ]);

    return {
      churches,
      metadata: {
        total,
        totalPages: Math.ceil(total / safeLimit),
        currentPage: page,
      },
    };
  },

  async updateChurchPlan(
    churchId: string,
    plan: PlanType,
    actor: { userId: string; email: string } // 👈 adiciona actor
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.church.findUnique({
        where: { id: churchId },
        select: { plan: true },
      });

      if (!existing) throw new Error("CHURCH_NOT_FOUND");

      const updated = await tx.church.update({
        where: { id: churchId },
        data: { plan },
        select: { id: true, name: true, plan: true },
      });

      // 👈 actualiza a subscription também
      await tx.subscription.updateMany({
        where: { churchId },
        data: { plan },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "UPDATE_CHURCH_PLAN",
          entityName: "Church",
          entityId: churchId,
          oldData: { plan: existing?.plan },
          newData: { plan },
        },
      });

      return updated;
    });
  },
};