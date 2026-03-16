"use server";

import { auth } from "@/lib/auth";
import { SuperAdminService } from "@/services/superAdminService";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  if (session.user.role !== "SUPER_ADMIN") throw new Error("FORBIDDEN");
  return session;
}

export async function getGlobalStatsAction() {
  try {
    await requireSuperAdmin();
    const stats = await SuperAdminService.getGlobalStats();
    return { success: true, data: stats };
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return { success: false, error: "Não autenticado." };
    if (error.message === "FORBIDDEN") return { success: false, error: "Sem permissão." };
    return { success: false, error: "Erro ao carregar estatísticas." };
  }
}

export async function updateChurchPlanAction(churchId: string, plan: "FREE" | "PRO" | "ENTERPRISE") {
  try {
    await requireSuperAdmin();

    const schema = z.object({
      churchId: z.string().min(1),
      plan: z.enum(["FREE", "PRO", "ENTERPRISE"]),
    });

    schema.parse({ churchId, plan });

    await SuperAdminService.updateChurchPlan(churchId, plan);

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return { success: false, error: "Não autenticado." };
    if (error.message === "FORBIDDEN") return { success: false, error: "Sem permissão." };
    console.error("[UPDATE_CHURCH_PLAN_ERROR]:", error);
    return { success: false, error: "Erro ao actualizar plano." };
  }
}