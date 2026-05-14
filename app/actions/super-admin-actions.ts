"use server";

import { auth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/errors";
import { PLAN_VALUES, PlanType } from "@/lib/plans";
import { GlobalStats, SuperAdminService } from "@/services/superAdminService";
import { ActionResult, ActionResultWithData } from "@/types/action-result";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  if (session.user.role !== "SUPER_ADMIN") throw new Error("FORBIDDEN");
  return session;
}

export async function getGlobalStatsAction(): Promise<ActionResultWithData<GlobalStats>> {
  try {
    await requireSuperAdmin();
    const stats = await SuperAdminService.getGlobalStats();
    return { success: true, data: stats };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (["UNAUTHORIZED", "FORBIDDEN"].includes(message))
      return { success: false, errorCode: "unauthorized" };
    console.error("[GET_GLOBAL_STATS_ERROR]:", error); // 👈
    return { success: false, errorCode: "errorLoad" };
  }
}

export async function updateChurchPlanAction(churchId: string, plan: PlanType): Promise<ActionResult> {
  try {
    const session = await requireSuperAdmin();
    const actor = { userId: session.user.id as string, email: session.user.email! as string }; // 👈

    const result = z.object({
      churchId: z.string().min(1),
      plan: z.enum(PLAN_VALUES),
    }).safeParse({ churchId, plan });

    if (!result.success)
      return { success: false, errorCode: "invalidData" };

    await SuperAdminService.updateChurchPlan(churchId, plan, actor); // 👈

    revalidatePath("/admin");
    return { success: true };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (["UNAUTHORIZED", "FORBIDDEN"].includes(message))
      return { success: false, errorCode: "unauthorized" };
    if (message === "CHURCH_NOT_FOUND")
      return { success: false, errorCode: "churchNotFound" };
    console.error("[UPDATE_CHURCH_PLAN_ERROR]:", error);
    return { success: false, errorCode: "errorUpdate" };
  }
}
