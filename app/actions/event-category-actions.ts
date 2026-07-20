"use server";

import { EventCategoryService } from "@/services/eventCategoryService";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getErrorMessage, isPrismaError } from "@/lib/errors";
import { getAuthContext } from "@/lib/auth-context";
import { ActionResult, ActionResultWithId } from "@/types/action-result";


const categorySchema = z.object({
  name: z.string().min(1, "validation.nameRequired").max(100, "validation.nameTooLong").trim(),
});


export async function saveEventCategoryAction(
  formData: FormData,
  categoryId?: string,
  targetChurchId?: string,
): Promise<ActionResultWithId> {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    const result = categorySchema.safeParse(Object.fromEntries(formData.entries()));
    if (!result.success) {
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };
    }

    if (categoryId) {
      await EventCategoryService.updateCategory(categoryId, churchId, actor, result.data);
      revalidatePath(`/[locale]/[slug]/configuracoes/categorias-eventos`, "page"); // 👈 adiciona
      revalidatePath(`/[locale]/[slug]/eventos`, "page");
      return { success: true, id: categoryId }; // 👈 id real do banco
    } else {
      const category = await EventCategoryService.createCategory(churchId, actor, result.data);

      revalidatePath(`/[locale]/[slug]/configuracoes/categorias-eventos`, "page");
      revalidatePath(`/[locale]/[slug]/eventos`, "page");
      return { success: true, id: category.id };
    }

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED" || message === "CHURCH_ID_REQUIRED")
      return { success: false, errorCode: "unauthorized" };
    if (message === "CATEGORY_NOT_FOUND")
      return { success: false, errorCode: "categoryNotFound" };
    if (message === "CATEGORY_DUPLICATE")
      return { success: false, fieldErrors: { name: ["eventCategories.errors.duplicate"] } };
    if (isPrismaError(error) && error.code === "P2002")
      return { success: false, fieldErrors: { name: ["eventCategories.errors.duplicate"] } };
    console.error("[SAVE_EVENT_CATEGORY_ERROR]:", error);
    return { success: false, errorCode: "errorSave" };
  }
}

export async function deleteEventCategoryAction(
  id: string,
  targetChurchId?: string,
): Promise<ActionResult> {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    await EventCategoryService.deleteCategory(id, churchId, actor);

    revalidatePath(`/[locale]/[slug]/configuracoes/categorias-eventos`, "page");
    return { success: true };

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED" || message === "CHURCH_ID_REQUIRED")
      return { success: false, errorCode: "unauthorized" };
    if (message === "CATEGORY_NOT_FOUND")
      return { success: false, errorCode: "categoryNotFound" };
    if (message === "CATEGORY_HAS_EVENTS")
      return { success: false, errorCode: "categoryHasEvents" };
    if (isPrismaError(error) && error.code === "P2025")
      return { success: false, errorCode: "categoryAlreadyDeleted" };
    console.error("[DELETE_EVENT_CATEGORY_ERROR]:", error);
    return { success: false, errorCode: "errorDelete" };
  }
}