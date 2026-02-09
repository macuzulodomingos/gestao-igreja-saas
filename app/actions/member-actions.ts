"use server";

import { auth } from "@/lib/auth";
import { MemberService } from "@/services/memberService";
import { revalidatePath } from "next/cache";
import { memberSchema } from "@/lib/validations/member";

/**
 * Helper privado para garantir segurança e auditoria em todas as ações.
 * Extrai o usuário logado e define qual igreja será afetada (Multi-tenant).
 */
async function getAuthContext(targetChurchId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  // Se for admin e houver um alvo, usa o alvo. Caso contrário, usa a igreja do usuário.
  const churchId =
    isSuperAdmin && targetChurchId ? targetChurchId : session.user.churchId;

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
      joinDate: joinDateUTC, // Use a data tratada aqui também
      phone: sanitizedPhone,
    });

    revalidatePath(`/[slug]/membros`, "page");
    return { success: true };
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    if (error.code === "P2002")
      return { success: false, error: "E-mail já cadastrado nesta igreja." };
    return { success: false, error: "Erro interno ao salvar membro." };
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
      joinDate: joinDateUTC, // Passamos a data tratada
      phone: sanitizedPhone,
    });

    revalidatePath(`/[slug]/membros`, "page");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao editar:", error);
    return {
      success: false,
      error: "Erro ao atualizar dados ou acesso negado.",
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
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: "Falha na exclusão: Registro não encontrado ou sem permissão.",
    };
  }
}
