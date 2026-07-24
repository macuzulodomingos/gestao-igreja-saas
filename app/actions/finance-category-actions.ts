"use server";

import { FinanceCategoryService } from "@/services/financeCategoryService";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth-context";
import { getErrorMessage, isPrismaError } from "@/lib/errors";
import { TransactionType } from '@/app/generated/prisma/enums';
import { ActionResult } from "@/types/action-result";

const categorySchema = z.object({
  name: z.string().trim().min(1, "validation.nameRequired").max(50, "validation.categoryNameTooLong"),
  type: z.nativeEnum(TransactionType),
});

export async function saveCategoryAction(
  formData: FormData,
  categoryId?: string,
  targetChurchId?: string,
): Promise<ActionResult> {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    const result = categorySchema.safeParse(Object.fromEntries(formData.entries()));
    if (!result.success) {
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };
    }

    if (categoryId) {
      await FinanceCategoryService.updateCategory(categoryId, churchId, actor, result.data);
    } else {
      await FinanceCategoryService.createCategory(churchId, actor, result.data);
    }

    revalidatePath(`/[locale]/[slug]/configuracoes/categorias`, "page");
    revalidatePath(`/[locale]/[slug]/financas`, "page");
    return { success: true };

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, errorCode: "unauthorized" };
    if (message === "CHURCH_ID_REQUIRED")
      return { success: false, errorCode: "churchNotFound" };
    if (message === "CATEGORY_TYPE_CHANGE_BLOCKED") 
      return { success: false, errorCode: "categoryTypeChangeBlocked" };
    if (message === "CATEGORY_NOT_FOUND")
      return { success: false, errorCode: "categoryNotFound" };
    if (message === "CATEGORY_DUPLICATE")
      return { success: false, fieldErrors: { name: ["categories.errors.duplicate"] } };
    if (isPrismaError(error) && error.code === "P2002")
      return { success: false, fieldErrors: { name: ["categories.errors.duplicate"] } };
    console.error("[SAVE_CATEGORY_ERROR]:", error);
    return { success: false, errorCode: "errorSave" };
  }
}

export async function deleteCategoryAction(
  id: string,
  targetChurchId?: string,
): Promise<ActionResult> {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    await FinanceCategoryService.deleteCategory(id, churchId, actor);

    revalidatePath(`/[locale]/[slug]/configuracoes/categorias`, "page");
    revalidatePath(`/[locale]/[slug]/financas`, "page");
    return { success: true };

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED" || message === "CHURCH_ID_REQUIRED")
      return { success: false, errorCode: "unauthorized" };
    if (message === "CATEGORY_NOT_FOUND")
      return { success: false, errorCode: "categoryNotFound" };
    if (message === "CATEGORY_HAS_TRANSACTIONS")
      return { success: false, errorCode: "categoryHasTransactions" };
    if (isPrismaError(error) && error.code === "P2025")
      return { success: false, errorCode: "categoryAlreadyDeleted" };
    if (isPrismaError(error) && error.code === "P2003")
      return { success: false, errorCode: "categoryHasTransactions" };
    console.error("[DELETE_CATEGORY_ERROR]:", error);
    return { success: false, errorCode: "errorDelete" };
  }
}