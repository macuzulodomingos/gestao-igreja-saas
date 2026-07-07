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

      await tx.auditLog.create({
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
    await prisma.$transaction(async (tx) => {
      // Leitura DENTRO da transação — elimina a janela de corrida entre
      // ler pendingPlan e escrever o update (duplo clique / duas abas).
      const sub = await tx.subscription.findUnique({
        where: { churchId },
        select: { pendingPlan: true, pendingCycle: true, currentPeriodEnd: true },
      });

      if (!sub || !sub.pendingPlan || !sub.pendingCycle) {
        throw new Error("NO_PENDING_PAYMENT");
      }

      const now = new Date();
      const baseDate = sub.currentPeriodEnd && sub.currentPeriodEnd > now ? sub.currentPeriodEnd : now;
      const newPeriodEnd = new Date(baseDate);
      if (sub.pendingCycle === "ANNUAL") {
        newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
      } else {
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
      }

      // updateMany com filtro de pendingPlan garante idempotência: se uma
      // segunda chamada concorrente chegar aqui depois desta ter zerado
      // pendingPlan, ela afeta 0 linhas e cai no throw abaixo.
      const updated = await tx.subscription.updateMany({
        where: { churchId, pendingPlan: { not: null } },
        data: {
          plan: sub.pendingPlan,
          billingCycle: sub.pendingCycle,
          status: "ACTIVE",
          currentPeriodEnd: newPeriodEnd,
          confirmedBy: actor.userId,
          confirmedAt: now,
          pendingPlan: null,
          pendingCycle: null,
          proofOfPayment: null,
        },
      });

      if (updated.count === 0) {
        throw new Error("NO_PENDING_PAYMENT");
      }

      await tx.church.update({ where: { id: churchId }, data: { plan: sub.pendingPlan } });

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
            currentPeriodEnd: newPeriodEnd,
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
    await prisma.$transaction(async (tx) => {
      // Idem — leitura e escrita na mesma transação.
      const sub = await tx.subscription.findUnique({
        where: { churchId },
        select: { currentPeriodEnd: true, pendingPlan: true },
      });

      if (!sub || !sub.pendingPlan) {
        throw new Error("NO_PENDING_PAYMENT");
      }

      const now = Date.now();
      const threeDaysFromNow = new Date(now + 3 * 24 * 60 * 60 * 1000);

      const updated = await tx.subscription.updateMany({
        where: { churchId, pendingPlan: { not: null } },
        data: {
          rejectedAt: new Date(),
          rejectionReason: reason,
          pendingPlan: null,
          pendingCycle: null,
          proofOfPayment: null,
          currentPeriodEnd: sub.currentPeriodEnd && sub.currentPeriodEnd > threeDaysFromNow
            ? sub.currentPeriodEnd
            : threeDaysFromNow,
        },
      });

      if (updated.count === 0) {
        throw new Error("NO_PENDING_PAYMENT");
      }

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