"use server";

import { AuditService, ChurchLogsResult } from "@/services/auditService";
import { MemberService } from "@/services/memberService";
import { getErrorMessage } from "@/lib/errors";
import { getAuthContext } from "@/lib/auth-context";
import { ActionResultWithData } from "@/types/action-result";
import { AuditLog } from "@/types/audit";

type ChurchLogsActionResult =
  | { success: true } & ChurchLogsResult
  | { success: false; errorCode: string };

export async function getChurchLogsAction(
  filters?: { entityName?: string; action?: string; page?: number },
  targetChurchId?: string,
): Promise<ChurchLogsActionResult> {
  try {
    const { churchId, isSuperAdmin } = await getAuthContext(targetChurchId);

    // 🔒 ADMIN vê logs da sua igreja
    // 🔒 SUPER_ADMIN pode ver logs de sistema (null) ou de uma igreja (targetChurchId)
    const logChurchId = isSuperAdmin ? (targetChurchId ?? null) : churchId;

    if (!isSuperAdmin && !logChurchId) {
      return { success: false, errorCode: "unauthorized" };
    }

    const result = await AuditService.getChurchLogs(logChurchId, {
      ...filters,
      limit: 20,
    });

    return { success: true, ...result };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    // 👈 agrupa todos os erros de segurança num único check
    if (["UNAUTHORIZED", "CHURCH_ID_REQUIRED", "SECURITY_BREACH"].includes(message))
      return { success: false, errorCode: "unauthorized" };
    console.error("[GET_CHURCH_LOGS_ERROR]:", error);
    return { success: false, errorCode: "errorLoad" };

  }
}

export async function getMemberHistoryAction(
  memberId: string,
  targetChurchId?: string,
): Promise<ActionResultWithData<AuditLog[]>> {
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
    if (message === "UNAUTHORIZED" || message === "CHURCH_ID_REQUIRED")
      return { success: false, errorCode: "unauthorized" };
    console.error("Erro ao buscar histórico:", error);
    return { success: false, errorCode: "errorLoad" };

  }
}