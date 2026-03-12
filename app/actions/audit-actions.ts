"use server";

import { auth } from "@/lib/auth";
import { AuditService } from "@/services/auditService";
import { MemberService } from "@/services/memberService";
import { AuditLog } from "@/app/generated/prisma";

async function getAuthContext() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const churchId = session.user.churchId;

  if (!churchId && !isSuperAdmin) throw new Error("CHURCH_ID_REQUIRED");

  return { churchId, isSuperAdmin, session };
}

export async function getChurchLogsAction(filters?: {
  entityName?: string;
  action?: string;
  page?: number;
}) {
  try {
    const { churchId } = await getAuthContext();
    if (!churchId) return { success: false, error: "Igreja não encontrada." };

    const result = await AuditService.getChurchLogs(churchId, {
      ...filters,
      limit: 20,
    });

    return { success: true, ...result };
  } catch (error: any) {
    console.error("[GET_CHURCH_LOGS_ERROR]:", error);
    return { success: false, error: "Erro ao carregar logs." };
  }
}

export async function getMemberHistoryAction(memberId: string) {
  const session = await auth();
  const userChurchId = session?.user?.churchId;
  const userRole = session?.user?.role;

  if (!session) return { success: false, error: "Não autorizado" };

  try {
    const history = await MemberService.getMemberHistory(
      memberId,
      userRole === "SUPER_ADMIN" ? undefined : userChurchId
    );
    return { success: true, data: history as AuditLog[] };
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return { success: false, error: "Falha ao carregar histórico" };
  }
}