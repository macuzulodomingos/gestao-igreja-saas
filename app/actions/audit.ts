// app/actions/audit.ts
"use server";

import { auth } from "@/lib/auth";
import { MemberService } from "@/services/memberService";

export async function getMemberHistoryAction(memberId: string) {
  const session = await auth();
  const churchId = session?.user?.churchId;

  if (!churchId) return { success: false, error: "Não autorizado" };

  try {
    const history = await MemberService.getMemberHistory(memberId, churchId);
    return { success: true, data: history };
  } catch (error) {
    return { success: false, error: "Falha ao carregar histórico" };
  }
}