import prisma from "@/lib/prisma";
import { Plan, BillingCycle } from "@prisma/client";

export const PRICES = {
  PRO: { MONTHLY: 5000, ANNUAL: 55000 },
  ENTERPRISE: { MONTHLY: 15000, ANNUAL: 165000 },
} as const;

export const BillingService = {
    
  async getSubscription(churchId: string) {
    return prisma.subscription.findUnique({
      where: { churchId },
      select: {
        id: true,
        status: true,
        plan: true,
        billingCycle: true,
        currentPeriodEnd: true,
        pendingPlan: true,
        pendingCycle: true,
        proofOfPayment: true,
        proofUploadedAt: true,
        confirmedAt: true,
        rejectedAt: true,
        rejectionReason: true,
      },
    });
  },

  async submitPaymentProof(
    churchId: string,
    actor: { userId: string; email: string },
    data: {
      plan: Plan;
      billingCycle: BillingCycle;
      proofOfPayment: string;
    }
  ) {
    // Cria ou actualiza a subscription com o pedido pendente
    await prisma.subscription.upsert({
      where: { churchId },
      create: {
        churchId,
        plan: "FREE",
        billingCycle: "MONTHLY",
        currentPeriodEnd: new Date(),
        status: "TRIALING",
        pendingPlan: data.plan,
        pendingCycle: data.billingCycle,
        proofOfPayment: data.proofOfPayment,
        proofUploadedAt: new Date(),
      },
      update: {
        pendingPlan: data.plan,
        pendingCycle: data.billingCycle,
        proofOfPayment: data.proofOfPayment,
        proofUploadedAt: new Date(),
        rejectedAt: null,
        rejectionReason: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        churchId,
        userId: actor.userId,
        userEmail: actor.email,
        action: "SUBMIT_PAYMENT_PROOF",
        entityName: "Subscription",
        entityId: churchId,
        newData: {
          plan: data.plan,
          billingCycle: data.billingCycle,
          proofOfPayment: data.proofOfPayment,
        },
      },
    });
  },

  async confirmPayment(
    churchId: string,
    actor: { userId: string; email: string }
  ) {
    const sub = await prisma.subscription.findUnique({
      where: { churchId },
      select: { pendingPlan: true, pendingCycle: true },
    });

    if (!sub?.pendingPlan || !sub?.pendingCycle)
      throw new Error("NO_PENDING_PAYMENT");

    const now = new Date();
    const isAnnual = sub.pendingCycle === "ANNUAL";

    // Calcula data de fim do período
    const currentPeriodEnd = new Date(now);
    if (isAnnual) {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    } else {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    }

    // Actualiza subscription e plan da igreja em transacção
    await prisma.$transaction([
      prisma.subscription.update({
        where: { churchId },
        data: {
          plan: sub.pendingPlan,
          billingCycle: sub.pendingCycle,
          status: "ACTIVE",
          currentPeriodEnd,
          confirmedBy: actor.userId,
          confirmedAt: now,
          pendingPlan: null,
          pendingCycle: null,
        },
      }),
      prisma.church.update({
        where: { id: churchId },
        data: { plan: sub.pendingPlan },
      }),
    ]);

    await prisma.auditLog.create({
      data: {
        churchId,
        userId: actor.userId,
        userEmail: actor.email,
        action: "CONFIRM_PAYMENT",
        entityName: "Subscription",
        entityId: churchId,
        newData: {
          plan: sub.pendingPlan,
          billingCycle: sub.pendingCycle,
          currentPeriodEnd,
        },
      },
    });
  },

  async rejectPayment(
    churchId: string,
    actor: { userId: string; email: string },
    reason: string
  ) {
    await prisma.subscription.update({
      where: { churchId },
      data: {
        rejectedAt: new Date(),
        rejectionReason: reason,
        pendingPlan: null,
        pendingCycle: null,
        proofOfPayment: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        churchId,
        userId: actor.userId,
        userEmail: actor.email,
        action: "REJECT_PAYMENT",
        entityName: "Subscription",
        entityId: churchId,
        newData: { reason },
      },
    });
  },

  // Para o painel do SUPER_ADMIN — lista pedidos pendentes
  async getPendingPayments() {
    return prisma.subscription.findMany({
      where: { pendingPlan: { not: null } },
      select: {
        id: true,
        churchId: true,
        pendingPlan: true,
        pendingCycle: true,
        proofOfPayment: true,
        proofUploadedAt: true,
        church: { select: { name: true, slug: true } },
      },
      orderBy: { proofUploadedAt: "asc" },
    });
  },
};