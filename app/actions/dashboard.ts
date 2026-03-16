"use server";

import { DashboardService } from "@/services/dashboardService";
import { auth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/errors";

async function getAuthContext(targetChurchId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const churchId = isSuperAdmin && targetChurchId
    ? targetChurchId
    : session.user.churchId;

  if (!churchId) throw new Error("CHURCH_ID_REQUIRED");

  return {
    churchId,
    actor: {
      userId: session.user.id,
      email: session.user.email!,
    },
    isSuperAdmin,
  };
}

export async function getDashboardStatsAction(targetChurchId?: string) {
  try {
    const { churchId } = await getAuthContext(targetChurchId);

    const stats = await DashboardService.getChurchStats(churchId);

    return { success: true, data: stats };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    if (message === "CHURCH_ID_REQUIRED")
      return { success: false, error: "Igreja não encontrada." };
    console.error("Erro ao buscar estatísticas do dashboard:", error);
    return { success: false, error: "Erro interno ao carregar o dashboard." };
  }
}