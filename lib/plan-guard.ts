import prisma from "@/lib/prisma";
import { getPlanLimits, PlanType } from "@/lib/plans";

export async function checkMemberLimit(churchId: string, plan: PlanType) {
  const limits = getPlanLimits(plan);
  if (limits.members === Infinity) return;

  const count = await prisma.member.count({
    where: { churchId, deletedAt: null },
  });

  if (count >= limits.members)
    throw new Error("PLAN_LIMIT_MEMBERS");
}

export async function checkUserLimit(churchId: string, plan: PlanType) {
  const limits = getPlanLimits(plan);
  if (limits.users === Infinity) return;

  const count = await prisma.user.count({
    where: { churchId, deletedAt: null },
  });

  if (count >= limits.users)
    throw new Error("PLAN_LIMIT_USERS");
}

export async function checkDepartmentLimit(churchId: string, plan: PlanType) {
  const limits = getPlanLimits(plan);
  if (limits.departments === Infinity) return;

  const count = await prisma.department.count({
    where: { churchId },
  });

  if (count >= limits.departments)
    throw new Error("PLAN_LIMIT_DEPARTMENTS");
}

export async function checkEventMonthlyLimit(churchId: string, plan: PlanType) {
  const limits = getPlanLimits(plan);
  if (limits.eventsPerMonth === Infinity) return;

  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const count = await prisma.event.count({
    where: {
      churchId,
      startAt: { gte: startOfMonth },
    },
  });

  if (count >= limits.eventsPerMonth)
    throw new Error("PLAN_LIMIT_EVENTS");
}

export async function checkTransactionMonthlyLimit(churchId: string, plan: PlanType) {
  const limits = getPlanLimits(plan);
  if (limits.transactionsPerMonth === Infinity) return;

  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const count = await prisma.financeTransaction.count({
    where: {
      churchId,
      date: { gte: startOfMonth },
    },
  });

  if (count >= limits.transactionsPerMonth)
    throw new Error("PLAN_LIMIT_TRANSACTIONS");
}

export function checkPdfExport(plan: PlanType) {
  const limits = getPlanLimits(plan);
  if (!limits.pdfExport)
    throw new Error("PLAN_LIMIT_PDF_EXPORT");
}


export async function checkSubscriptionAccess(churchId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { churchId },
    select: {
      status: true,
      currentPeriodEnd: true,
      pendingPlan: true,
      proofUploadedAt: true,
    },
  });

  // sem subscrição — usa plano FREE sem restrições de acesso
  if (!sub) return;

  // activo — acesso total
  if (sub.status === "ACTIVE" && sub.currentPeriodEnd > new Date()) return;

  // comprovativo pendente dentro do prazo de 3 dias — grace period
  if (sub.pendingPlan && sub.proofUploadedAt) {
    const limit = new Date(sub.proofUploadedAt);
    limit.setDate(limit.getDate() + 3);
    if (new Date() <= limit) return;
  }

  // currentPeriodEnd ainda válido — acesso permitido
  if (sub.currentPeriodEnd > new Date()) return;

  throw new Error("SUBSCRIPTION_EXPIRED");
}