"use server";

import { auth } from "@/lib/auth";
import { EventCategoryService } from "@/services/eventCategoryService";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getErrorMessage, isPrismaError } from "@/lib/errors";
import { getAuthContext } from "@/lib/auth-context";

const categorySchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100),
});


export async function saveEventCategoryAction(
  formData: FormData,
  categoryId?: string,
  targetChurchId?: string,
) {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    const result = categorySchema.safeParse(Object.fromEntries(formData.entries()));
    if (!result.success) {
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };
    }

    if (categoryId) {
      await EventCategoryService.updateCategory(categoryId, churchId, actor, result.data);
      revalidatePath(`/[slug]/configuracoes/categorias-eventos`, "page");
      return { success: true, id: categoryId }; // 👈 id real do banco
    } else {
      const category = await EventCategoryService.createCategory(churchId, actor, result.data);
      revalidatePath(`/[slug]/configuracoes/categorias-eventos`, "page");
      return { success: true, id: category.id }; // 👈 id real do banco
    }

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    if (message === "CHURCH_ID_REQUIRED")
      return { success: false, error: "Igreja não encontrada." };
    if (message === "CATEGORY_NOT_FOUND")
      return { success: false, error: "Categoria não encontrada." };
    if (isPrismaError(error) && error.code === "P2002")
      return { success: false, fieldErrors: { name: ["Esta categoria já existe."] } };
    console.error("[SAVE_EVENT_CATEGORY_ERROR]:", error);
    return { success: false, error: "Erro ao guardar categoria." };
  }
}

export async function deleteEventCategoryAction(
  id: string,
  targetChurchId?: string,
) {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    await EventCategoryService.deleteCategory(id, churchId, actor);

    revalidatePath(`/[slug]/configuracoes/categorias-eventos`, "page");
    return { success: true };

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    if (message === "CATEGORY_NOT_FOUND")
      return { success: false, error: "Categoria não encontrada." };
    if (message === "CATEGORY_HAS_EVENTS")
      return { success: false, error: "Não é possível eliminar uma categoria com eventos associados." };
    if (isPrismaError(error) && error.code === "P2025")
      return { success: false, error: "Categoria já foi eliminada." };
    console.error("[DELETE_EVENT_CATEGORY_ERROR]:", error);
    return { success: false, error: "Erro ao eliminar categoria." };
  }
}