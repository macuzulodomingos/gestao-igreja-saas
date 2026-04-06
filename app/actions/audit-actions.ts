"use server";

import { AuditService } from "@/services/auditService";
import { MemberService } from "@/services/memberService";
import { getErrorMessage } from "@/lib/errors";
import { getAuthContext } from "@/lib/auth-context";



export async function getChurchLogsAction(
  filters?: { entityName?: string; action?: string; page?: number },
  targetChurchId?: string,
) {
  try {
    const { churchId, isSuperAdmin } = await getAuthContext(targetChurchId);

    // 🔒 ADMIN vê logs da sua igreja
    // 🔒 SUPER_ADMIN pode ver logs de sistema (null) ou de uma igreja (targetChurchId)
    const logChurchId = isSuperAdmin ? (targetChurchId ?? null) : churchId;

    if (!isSuperAdmin && !logChurchId) {
      return { success: false, error: "Igreja não encontrada." };
    }

    const result = await AuditService.getChurchLogs(logChurchId, {
      ...filters,
      limit: 20,
    });

    return { success: true, ...result };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    if (message === "CHURCH_ID_REQUIRED")
      return { success: false, error: "Igreja não encontrada." };
    console.error("[GET_CHURCH_LOGS_ERROR]:", error);
    return { success: false, error: "Erro ao carregar logs." };
  }
}

export async function getMemberHistoryAction(
  memberId: string,
  targetChurchId?: string,
) {
  try {
    const { churchId, isSuperAdmin } = await getAuthContext(targetChurchId);

    const history = await MemberService.getMemberHistory(
      memberId,
      isSuperAdmin ? undefined : churchId
    );

    // 👈 mapeia para o tipo AuditLog centralizado
    const mapped = history.map((log) => ({
      id: log.id,
      churchId: log.churchId,
      userId: log.userId,
      userEmail: log.userEmail,
      action: log.action,
      entityName: log.entityName,
      entityId: log.entityId,
      oldData: log.oldData,
      newData: log.newData,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
    }));

    return { success: true, data: mapped };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    console.error("Erro ao buscar histórico:", error);
    return { success: false, error: "Falha ao carregar histórico" };
  }
}