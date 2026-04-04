"use server";

import { MemberRoleService } from "@/services/memberRoleService";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth-context";
import { getErrorMessage, isPrismaError } from "@/lib/errors"; // 👈 Teu padrão



const roleSchema = z.object({
  name: z.string().min(1, "validation.nameRequired").max(50, "validation.nameTooLong"),
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
      return { success: false, errorCode: "unauthorized" };
    if (message === "CHURCH_ID_REQUIRED")
      return { success: false, errorCode: "unauthorized" };
    if (isPrismaError(error) && error.code === "P2002")
      return { success: false, errorCode: "duplicate" };
    console.error("[SAVE_ROLE_ERROR]:", error);
    return { success: false, errorCode: "errorSave" };
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
      return { success: false, errorCode: "unauthorized" };
    if (message.includes("Não é possível eliminar"))
      return { success: false, errorCode: "roleHasMembers" };
    if (isPrismaError(error) && error.code === "P2003")
      return { success: false, errorCode: "roleHasMembers" };
    console.error("[DELETE_ROLE_ERROR]:", error);
    return { success: false, errorCode: "errorDelete" };
  }
}