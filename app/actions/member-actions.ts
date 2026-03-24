"use server";

import { MemberService } from "@/services/memberService";
import { revalidatePath } from "next/cache";
import { memberSchema } from "@/lib/validations/member";
import { updateTag } from "next/cache";
import { getAuthContext } from "@/lib/auth-context";
import { getErrorMessage, isPrismaError } from "@/lib/errors"; // 👈 Teu padrão

/**
 * Helper privado para garantir segurança e auditoria em todas as ações.
 * Extrai o usuário logado e define qual igreja será afetada (Multi-tenant).
 */


// --- ACTION DE CRIAR ---
export async function createMemberAction(
  formData: FormData,
  targetChurchId?: string,
) {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    const result = memberSchema.safeParse(
      Object.fromEntries(formData.entries()),
    );
    if (!result.success) {
      return {
        success: false,
        fieldErrors: result.error.flatten().fieldErrors,
      };
    }

    const sanitizedPhone = result.data.phone?.replace(/[^\d+]/g, "");

    // Garante que a data de criação também tenha o "offset" de segurança
    const joinDateUTC = result.data.joinDate
      ? new Date(`${result.data.joinDate}T12:00:00Z`)
      : new Date(); // Se não houver data, usa agora

    await MemberService.createMember(churchId, actor, {
      ...result.data,
      roleId: result.data.role || null,
      joinDate: joinDateUTC, // Use a data tratada aqui também
      phone: sanitizedPhone,
    });

    revalidatePath(`/[slug]/membros`, "page");
    updateTag(`members-${churchId}`);
    updateTag(`church-${churchId}`);

    return { success: true };
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    if (message === "CHURCH_ID_REQUIRED")
      return { success: false, error: "Igreja não encontrada." };
    
    // 2. Lógica de Negócio do Service
    if (message === "INVALID_ROLE")
      return { success: false, error: "O cargo selecionado não pertence a esta igreja." };
    if (message === "INVALID_JOIN_DATE_TYPE") {
      return { success: false, error: "O formato da data de entrada é inválido." };
    }

    // 3. Prisma (Banco de Dados)
    if (isPrismaError(error)) {
      if (error.code === "P2002")
        return { success: false, error: "Este e-mail já está em uso nesta igreja." };
    }

    console.error("[CREATE_MEMBER_ERROR]:", error);
    return { success: false, error: "Falha ao realizar o cadastro do membro." };
  }
}

// --- ACTION DE EDITAR ---
export async function updateMemberAction(
  memberId: string,
  formData: FormData,
  targetChurchId?: string,
) {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    const result = memberSchema.safeParse(
      Object.fromEntries(formData.entries()),
    );
    if (!result.success) {
      return {
        success: false,
        fieldErrors: result.error.flatten().fieldErrors,
      };
    }

    const sanitizedPhone = result.data.phone?.replace(/[^\d+]/g, "");


    // AJUSTE DE DATA: Forçamos a string YYYY-MM-DD a ser interpretada como UTC Meio-dia
    // Isso evita que oscilações de fuso horário mudem o dia ao salvar.
    const joinDateUTC = result.data.joinDate
      ? new Date(`${result.data.joinDate}T12:00:00Z`)
      : undefined;

    await MemberService.updateMember(memberId, churchId, actor, {
      ...result.data,
      roleId: result.data.role || null,
      joinDate: joinDateUTC, // Passamos a data tratada
      phone: sanitizedPhone,
    });

    revalidatePath(`/[slug]/membros`, "page");
    updateTag(`members-${churchId}`);
    updateTag(`church-${churchId}`);

    return { success: true };
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    // 1. Erros de Permissão / Auth
    if (message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    if (message === "CHURCH_ID_REQUIRED")
      return { success: false, error: "Igreja não identificada." };

    // 2. Erros vindos diretamente do teu MemberService (Lógica de Negócio)
    if (message === "MEMBER_NOT_FOUND")
      return { success: false, error: "Membro não encontrado ou acesso negado." };
    if (message === "INVALID_ROLE")
      return { success: false, error: "O cargo selecionado é inválido para esta igreja." };
    if (message === "INVALID_JOIN_DATE_TYPE") {
      return { success: false, error: "O formato da data de entrada é inválido." };
    }

    // 3. Erros do Banco de Dados (Prisma)
    if (isPrismaError(error)) {
      if (error.code === "P2002") 
        return { success: false, error: "Este e-mail já está em uso nesta igreja." };
    }

    console.error("[UPDATE_MEMBER_ERROR]:", error);
    return { 
      success: false, 
      error: "Falha ao atualizar dados do membro. Tente novamente." 
    };
  }
}

// --- ACTION DE DELETAR ---
export async function deleteMemberAction(
  memberId: string,
  targetChurchId?: string,
) {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    await MemberService.deleteMember(memberId, churchId, actor);

    revalidatePath(`/[slug]/membros`, "page");
    updateTag(`members-${churchId}`);
    updateTag(`church-${churchId}`);
    
    return { success: true };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED") 
      return { success: false, error: "Não autenticado." };
    if (message === "MEMBER_NOT_FOUND")
      return { success: false, error: "Membro não encontrado ou você não tem permissão." };
    if (isPrismaError(error)) {
      if (error.code === "P2003")
        return { 
          success: false, 
          error: "Não é possível excluir este membro pois ele possui registros (financeiros ou históricos) vinculados." 
        };
    }

    console.error("[DELETE_MEMBER_ERROR]:", error);
    return { success: false, error: "Erro ao tentar remover o membro." };
  }
}
