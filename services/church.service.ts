// services/church.service.ts
import prisma from "@/lib/prisma";

export async function getChurchStats(churchId: string) {
  // Executamos várias contagens em paralelo para performance
  const [memberCount, eventCount, financialSummary] = await Promise.all([
    prisma.member.count({ where: { churchId, status: "Active" } }),
    prisma.churchEvent.count({ 
      where: { 
        churchId,
        date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } 
      } 
    }),
    prisma.financeTransaction.aggregate({
      where: { churchId },
      _sum: { amount: true }
    })
  ]);

  return {
    totalMembers: memberCount,
    eventsThisMonth: eventCount,
    monthlyBalance: financialSummary._sum.amount || 0,
    // ... outros cálculos
  };
}