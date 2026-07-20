"use server";

import { MemberService } from "@/services/memberService";
import { revalidatePath, updateTag } from "next/cache";
import { memberSchema } from "@/lib/validations/member";
import { getAuthContext } from "@/lib/auth-context";
import { getErrorMessage, isPrismaError } from "@/lib/errors"; // 👈 Teu padrão
import { checkMemberLimit } from "@/lib/plan-guard";
import { ActionResult, ActionResultWithData } from "@/types/action-result";
import { AttendeeMember } from "@/types/event";



// --- ACTION DE CRIAR ---
export async function createMemberAction(
  formData: FormData,
  targetChurchId?: string,
): Promise<ActionResult> {
  try {
    const { churchId, actor, plan } = await getAuthContext(targetChurchId);

    // 👈 verifica limite antes de criar
    await checkMemberLimit(churchId, plan);

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
      : new Date(new Date().toISOString().split("T")[0] + "T12:00:00Z");

    await MemberService.createMember(churchId, actor, {
      ...result.data,
      roleId: result.data.role || null,
      joinDate: joinDateUTC, // Use a data tratada aqui também
      phone: sanitizedPhone,
    });

    revalidatePath(`/[locale]/[slug]/membros`, "page");
    updateTag(`members-${churchId}`);
    updateTag(`church-${churchId}`);

    return { success: true };
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message === "UNAUTHORIZED" || message === "CHURCH_ID_REQUIRED")
      return { success: false, errorCode: "unauthorized" };
    if (message === "PLAN_LIMIT_MEMBERS")
      return { success: false, errorCode: "planLimitMembers", upgrade: true };

    // 2. Lógica de Negócio do Service
    if (message === "INVALID_ROLE")
      return { success: false, errorCode: "invalidRole" };
    if (message === "INVALID_JOIN_DATE_TYPE") {
      return { success: false, errorCode: "invalidDate" };
    }

    // 3. Prisma (Banco de Dados)
    if (isPrismaError(error)) {
      if (error.code === "P2002")
        return { success: false, errorCode: "emailTaken" };
    }

    console.error("[CREATE_MEMBER_ERROR]:", error);
    return { success: false, errorCode: "errorCreate" };
  }
}

// --- ACTION DE EDITAR ---
export async function updateMemberAction(
  memberId: string,
  formData: FormData,
  targetChurchId?: string,
): Promise<ActionResult> {
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

    revalidatePath(`/[locale]/[slug]/membros`, "page");
    updateTag(`members-${churchId}`);
    updateTag(`church-${churchId}`);

    return { success: true };
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    // 1. Erros de Permissão / Auth
    if (message === "UNAUTHORIZED" || message === "CHURCH_ID_REQUIRED")
      return { success: false, errorCode: "unauthorized" };

    // 2. Erros vindos diretamente do teu MemberService (Lógica de Negócio)
    if (message === "MEMBER_NOT_FOUND")
      return { success: false, errorCode: "memberNotFound" };
    if (message === "INVALID_ROLE")
      return { success: false, errorCode: "invalidRole" };
    if (message === "INVALID_JOIN_DATE_TYPE") {
      return { success: false, errorCode: "invalidDate" };
    }

    // 3. Erros do Banco de Dados (Prisma)
    if (isPrismaError(error)) {
      if (error.code === "P2002")
        return { success: false, errorCode: "emailTaken" };
    }

    console.error("[UPDATE_MEMBER_ERROR]:", error);
    return {
      success: false,
      errorCode: "errorUpdate"
    };
  }
}

// --- ACTION DE DELETAR ---
export async function deleteMemberAction(
  memberId: string,
  targetChurchId?: string,
): Promise<ActionResult> {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    await MemberService.deleteMember(memberId, churchId, actor);

    revalidatePath(`/[locale]/[slug]/membros`, "page");
    updateTag(`members-${churchId}`);
    updateTag(`church-${churchId}`);

    return { success: true };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED" || message === "CHURCH_ID_REQUIRED")
      return { success: false, errorCode: "unauthorized" };
    if (message === "MEMBER_NOT_FOUND")
      return { success: false, errorCode: "memberNotFound" };
    if (message === "MEMBER_ALREADY_DELETED")
      return { success: false, errorCode: "memberAlreadyDeleted" };

    console.error("[DELETE_MEMBER_ERROR]:", error);
    return { success: false, errorCode: "errorDelete" };
  }
}

export async function searchActiveMembersAction(
  query: string,
  targetChurchId?: string,
): Promise<ActionResultWithData<AttendeeMember[]>> {
  try {
    const { churchId } = await getAuthContext(targetChurchId);
    const members = await MemberService.searchActiveMembers(churchId, query);
    return { success: true, data: members };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED" || message === "CHURCH_ID_REQUIRED")
      return { success: false, errorCode: "unauthorized" };
    console.error("[SEARCH_ACTIVE_MEMBERS_ERROR]:", error);
    return { success: false, errorCode: "errorLoad" };
  }
}