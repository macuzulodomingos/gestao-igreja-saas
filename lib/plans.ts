export const PLAN_LIMITS = {
  FREE: {
    members: 50,
    users: 1,
    departments: 3,
    eventsPerMonth: 10,
    transactionsPerMonth: 50,
    pdfExport: false,
    dataExport: false,
  },
  PRO: {
    members: 500,
    users: 5,
    departments: Infinity,
    eventsPerMonth: Infinity,
    transactionsPerMonth: Infinity,
    pdfExport: true,
    dataExport: true,
  },
  ENTERPRISE: {
    members: Infinity,
    users: Infinity,
    departments: Infinity,
    eventsPerMonth: Infinity,
    transactionsPerMonth: Infinity,
    pdfExport: true,
    dataExport: true,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export function getPlanLimits(plan: PlanType) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;
}

export function canUseFeature(
  plan: PlanType,
  feature: keyof typeof PLAN_LIMITS.FREE
): boolean {
  const limits = getPlanLimits(plan);
  const value = limits[feature];
  return value === true || value === Infinity;
}