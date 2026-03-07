"use server";

import { auth } from "@/lib/auth";
import { DepartmentService } from "@/services/departmentService";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const departmentSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100),
  description: z.string().max(500).optional(),
  leaderId: z.string().optional(),
});

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
    isSuperAdmin,
  };
}

export async function saveDepartmentAction(
  formData: FormData,
  departmentId?: string,
  targetChurchId?: string,
) {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    const result = departmentSchema.safeParse(
      Object.fromEntries(formData.entries())
    );
    if (!result.success) {
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };
    }

    const data = {
      name: result.data.name,
      description: result.data.description || undefined,
      leaderId: result.data.leaderId === "none" || !result.data.leaderId
        ? undefined
        : result.data.leaderId,
    };

    if (departmentId) {
      await DepartmentService.updateDepartment(departmentId, churchId, actor, data);
    } else {
      await DepartmentService.createDepartment(churchId, actor, data);
    }

    revalidatePath(`/[slug]/departamentos`, "page");
    return { success: true };

  } catch (error: any) {
    console.error("[SAVE_DEPARTMENT_ERROR]:", error);
    if (error.message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    return { success: false, error: "Erro ao salvar departamento." };
  }
}

export async function deleteDepartmentAction(
  id: string,
  targetChurchId?: string,
) {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    await DepartmentService.deleteDepartment(id, churchId, actor);

    revalidatePath(`/[slug]/departamentos`, "page");
    return { success: true };

  } catch (error: any) {
    console.error("[DELETE_DEPARTMENT_ERROR]:", error);
    if (error.message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    return { success: false, error: "Não foi possível eliminar o departamento." };
  }
}

export async function syncDepartmentMembersAction(
  departmentId: string,
  memberIds: string[],
  targetChurchId?: string,
) {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    await DepartmentService.syncDepartmentMembers(
      departmentId,
      churchId,
      memberIds,
      actor
    );

    revalidatePath(`/[slug]/departamentos`, "page");
    return { success: true };

  } catch (error: any) {
    console.error("[SYNC_MEMBERS_ERROR]:", error);
    if (error.message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    return { success: false, error: "Erro ao actualizar membros." };
  }
}