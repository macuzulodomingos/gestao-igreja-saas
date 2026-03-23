"use server";

import { MemberRoleService } from "@/services/memberRoleService";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth-context";
import { getErrorMessage, isPrismaError } from "@/lib/errors"; // 👈 Teu padrão



const roleSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(50, "Máximo 50 caracteres"),
});

export async function saveRoleAction(
  formData: FormData,
  roleId?: string,
  targetChurchId?: string,
) {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    const result = roleSchema.safeParse(
      Object.fromEntries(formData.entries())
    );

    if (!result.success) {
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };
    }

    if (roleId) {
      await MemberRoleService.updateRole(roleId, churchId, actor, result.data);
    } else {
      await MemberRoleService.createRole(churchId, actor, result.data);
    }

    revalidatePath(`/[slug]/configuracoes/cargos`, "page");
    return { success: true };

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    if (message === "CHURCH_ID_REQUIRED")
      return { success: false, error: "Igreja não identificada." };
    if (isPrismaError(error)) {
      if (error.code === "P2002")
        return { success: false, error: "Já existe um cargo com este nome nesta igreja." };
    }

    console.error("[SAVE_ROLE_ERROR]:", error);
    return { 
      success: false, 
      error: message || "Erro ao processar dados do cargo." 
    };
  }
}

export async function deleteRoleAction(
  id: string,
  targetChurchId?: string,
) {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    await MemberRoleService.deleteRole(id, churchId, actor);

    revalidatePath(`/[slug]/configuracoes/cargos`, "page");
    return { success: true };

  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    if (message.includes("Não é possível eliminar")) {
      return { success: false, error: message };
    }

    if (isPrismaError(error)) {
      if (error.code === "P2003")
        return { success: false, error: "Existem registros vinculados a este cargo." };
    }

    console.error("[DELETE_ROLE_ERROR]:", error);
    return { 
      success: false, 
      error: message || "Erro ao eliminar cargo." 
    };
  }
}