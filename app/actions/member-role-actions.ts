"use server";

import { auth } from "@/lib/auth";
import { MemberRoleService } from "@/services/memberRoleService";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function getAuthContext(targetChurchId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const churchId = isSuperAdmin && targetChurchId
    ? targetChurchId
    : session.user.churchId;

  if (!churchId) throw new Error("CHURCH_ID_REQUIRED");

  return {
    churchId,
    actor: { userId: session.user.id, email: session.user.email! },
  };
}

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

  } catch (error: any) {
    console.error("[SAVE_ROLE_ERROR]:", error);
    if (error.message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    return { success: false, error: error.message || "Erro ao salvar cargo." };
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

  } catch (error: any) {
    console.error("[DELETE_ROLE_ERROR]:", error);
    if (error.message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    return { success: false, error: error.message || "Erro ao eliminar cargo." };
  }
}