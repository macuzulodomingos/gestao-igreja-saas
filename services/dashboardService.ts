import prisma from "@/lib/prisma";

export class DashboardService {
  static async getChurchStats(churchId: string) {
    // Toda a lógica do Prisma fica aqui
    const [totalMembers, church] = await Promise.all([
      prisma.member.count({ where: { churchId } }),
      prisma.church.findUnique({ where: { id: churchId }, select: { plan: true } })
    ]);

    return {
      totalMembers,
      plan: church?.plan || "FREE",
      eventsThisMonth: 0, 
      monthlyBalance: 0,
      // ... outras métricas
    };
  }
}