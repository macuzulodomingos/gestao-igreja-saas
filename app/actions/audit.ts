// app/actions/audit.ts
"use server";

import { auth } from "@/lib/auth";
import { MemberService } from "@/services/memberService";
import { AuditLog } from "@prisma/client";

export async function getMemberHistoryAction(memberId: string) {
  const session = await auth();
  
  // 1. Pegamos o churchId e o role (cargo) do usuário logado
  const userChurchId = session?.user?.churchId;
  const userRole = session?.user?.role; // Ex: "SUPERADMIN", "ADMIN", "USER"

  if (!session) return { success: false, error: "Não autorizado" };

  try {
    // 2. Lógica de bypass: Se for SUPERADMIN, podemos passar null ou um sinalizador 
    // para o serviço buscar sem filtrar por igreja, ou buscar o churchId do membro primeiro.
    
    // Uma abordagem segura é: se não for admin, ele PRECISA ter o mesmo churchId do registro
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