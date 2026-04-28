"use server";

import { DashboardService } from "@/services/dashboardService";
import { getErrorMessage } from "@/lib/errors";
import { getAuthContext } from "@/lib/auth-context";



export async function getDashboardStatsAction(targetChurchId?: string) {
  try {
    const { churchId } = await getAuthContext(targetChurchId);

    const stats = await DashboardService.getChurchStats(churchId);

    return { success: true, data: stats };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, errorCode: "unauthorized" };
    if (message === "CHURCH_ID_REQUIRED")
      return { success: false, errorCode: "unauthorized" };
    console.error("Erro ao buscar estatísticas do dashboard:", error);
    return { success: false, errorCode: "errorLoad" };
    
  }
}