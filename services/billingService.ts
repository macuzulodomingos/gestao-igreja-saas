import { BillingCycle, Plan } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma";


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
    // 👈 audit dentro da transacção
    await prisma.$transaction(async (tx) => {
      await tx.subscription.upsert({
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

      await tx.auditLog.create({ // 👈 dentro da transacção
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
    });
  },

  async confirmPayment(
    churchId: string,
    actor: { userId: string; email: string }
  ) {
    const sub = await prisma.subscription.findUnique({
      where: { churchId },
      select: {
        pendingPlan: true,
        pendingCycle: true,
        currentPeriodEnd: true, // 👈 adiciona
      },
    });

    if (!sub?.pendingPlan || !sub?.pendingCycle)
      throw new Error("NO_PENDING_PAYMENT");

    const now = new Date();

    // 👈 soma ao tempo restante em vez de começar do zero
    const baseDate = (sub.currentPeriodEnd && sub.currentPeriodEnd > now)
      ? sub.currentPeriodEnd
      : now;

    const newPeriodEnd = new Date(baseDate);
    if (sub.pendingCycle === "ANNUAL") {
      newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
    } else {
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
    }

    await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { churchId },
        data: {
          plan: sub.pendingPlan!,
          billingCycle: sub.pendingCycle!,
          status: "ACTIVE",
          currentPeriodEnd: newPeriodEnd, // 👈 usa newPeriodEnd
          confirmedBy: actor.userId,
          confirmedAt: now,
          pendingPlan: null,
          pendingCycle: null,
          proofOfPayment: null, // 👈 limpa após confirmação
        },
      });

      await tx.church.update({
        where: { id: churchId },
        data: { plan: sub.pendingPlan! },
      });

      await tx.auditLog.create({
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
            currentPeriodEnd: newPeriodEnd, // 👈 usa newPeriodEnd
          },
        },
      });
    });
  },

  async rejectPayment(
    churchId: string,
    actor: { userId: string; email: string },
    reason: string
  ) {
    // 👈 busca currentPeriodEnd para não encurtar tempo restante
    const sub = await prisma.subscription.findUnique({
      where: { churchId },
      select: { currentPeriodEnd: true },
    });

    const now = Date.now();
    const threeDaysFromNow = new Date(now + 3 * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { churchId },
        data: {
          rejectedAt: new Date(),
          rejectionReason: reason,
          pendingPlan: null,
          pendingCycle: null,
          proofOfPayment: null,
          // 👈 só extende se já expirou ou está a menos de 3 dias
          currentPeriodEnd: sub?.currentPeriodEnd && sub.currentPeriodEnd > threeDaysFromNow
            ? sub.currentPeriodEnd  // mantém o tempo restante
            : threeDaysFromNow,     // dá 3 dias de carência
        },
      });

      await tx.auditLog.create({
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
    });
  },
  
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