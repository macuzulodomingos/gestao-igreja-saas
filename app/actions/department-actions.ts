"use server";

import { DepartmentService } from "@/services/departmentService";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getErrorMessage } from "@/lib/errors";
import { getAuthContext } from "@/lib/auth-context";
import { checkDepartmentLimit } from "@/lib/plan-guard";

const departmentSchema = z.object({
  name: z.string().min(1, "validation.nameRequired").max(100, "validation.departmentNameTooLong"),
  description: z.string().max(500, "validation.departmentDescTooLong").optional(),
  leaderId: z.string().optional(),
});



export async function saveDepartmentAction(
  formData: FormData,
  departmentId?: string,
  targetChurchId?: string,
) {
  try {
    const { churchId, actor, plan } = await getAuthContext(targetChurchId);

    const result = departmentSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!result.success) {
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };
    }

    const data = {
      name: result.data.name,
      description: result.data.description || undefined,
      leaderId: result.data.leaderId === "none" ? null : result.data.leaderId,
    };


    if (departmentId) {
      await DepartmentService.updateDepartment(departmentId, churchId, actor, data);
      revalidatePath(`/[slug]/departamentos`, "page");
    } else {
      await checkDepartmentLimit(churchId, plan);
      await DepartmentService.createDepartment(churchId, actor, data);
      revalidatePath(`/[slug]/departamentos`, "page");
    }

    revalidatePath(`/[slug]/departamentos`, "page");
    return { success: true };

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, errorCode: "unauthorized" };
    if (message === "CHURCH_ID_REQUIRED")
      return { success: false, errorCode: "unauthorized" };
    if (message === "INVALID_LEADER")
      return { success: false, errorCode: "invalidLeader" };
    if (message === "PLAN_LIMIT_DEPARTMENTS")
      return { success: false, errorCode: "planLimitDepartments", upgrade: true };
    console.error("[SAVE_DEPARTMENT_ERROR]:", error);
    return { success: false, errorCode: "errorSave" };
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

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, errorCode: "unauthorized" };
    if (message === "DEPARTMENT_NOT_FOUND")
      return { success: false, errorCode: "departmentNotFound" };
    console.error("[DELETE_DEPARTMENT_ERROR]:", error);
    return { success: false, errorCode: "errorDelete" };
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

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, errorCode: "unauthorized" };
    if (message === "INVALID_MEMBERS")
      return { success: false, errorCode: "invalidMembers" };
    if (message === "DEPARTMENT_NOT_FOUND")
      return { success: false, errorCode: "departmentNotFound" };
    console.error("[SYNC_MEMBERS_ERROR]:", error);
    return { success: false, errorCode: "errorSync" };
   
  }
}