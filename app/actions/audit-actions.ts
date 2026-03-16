"use server";

import { auth } from "@/lib/auth";
import { AuditService } from "@/services/auditService";
import { MemberService } from "@/services/memberService";
import { getErrorMessage } from "@/lib/errors";


async function getAuthContext(targetChurchId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const churchId = isSuperAdmin && targetChurchId
    ? targetChurchId
    : session.user.churchId;

  if (!churchId) throw new Error("CHURCH_ID_REQUIRED"); // 👈 mesmo padrão

  return {
    churchId,
    actor: {
      userId: session.user.id,
      email: session.user.email!,
    },
    isSuperAdmin,
  };
}

export async function getChurchLogsAction(
  filters?: { entityName?: string; action?: string; page?: number },
  targetChurchId?: string,
) {
  try {
    const { churchId } = await getAuthContext(targetChurchId);

    const result = await AuditService.getChurchLogs(churchId, {
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
    return { success: true, data: history };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    console.error("Erro ao buscar histórico:", error);
    return { success: false, error: "Falha ao carregar histórico" };
  }
}