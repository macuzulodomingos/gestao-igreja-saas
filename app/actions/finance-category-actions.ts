"use server";

import { FinanceCategoryService } from "@/services/financeCategoryService";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth-context";
import { getErrorMessage, isPrismaError } from "@/lib/errors";
import { TransactionType } from "@prisma/client";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório").max(50, "Máximo 50 caracteres"),
  type: z.nativeEnum(TransactionType),
});

export async function saveCategoryAction(
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
      await FinanceCategoryService.updateCategory(categoryId, churchId, actor, result.data);
    } else {
      await FinanceCategoryService.createCategory(churchId, actor, result.data);
    }

    revalidatePath(`/[slug]/configuracoes/categorias`, "page");
    return { success: true };

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    if (message === "CHURCH_ID_REQUIRED")
      return { success: false, error: "Igreja não encontrada." };
    if (message === "CATEGORY_NOT_FOUND")
      return { success: false, error: "Categoria não encontrada." };
    if (message === "CATEGORY_DUPLICATE")
      return { success: false, fieldErrors: { name: ["Já existe uma categoria com este nome e tipo."] } };
    if (isPrismaError(error) && error.code === "P2002")
      return { success: false, fieldErrors: { name: ["Esta categoria já existe."] } };
    console.error("[SAVE_CATEGORY_ERROR]:", error);
    return { success: false, error: "Erro ao salvar categoria." };
  }
}

export async function deleteCategoryAction(
  id: string,
  targetChurchId?: string,
) {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    await FinanceCategoryService.deleteCategory(id, churchId, actor);

    revalidatePath(`/[slug]/configuracoes/categorias`, "page");
    return { success: true };

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    if (message === "CATEGORY_NOT_FOUND")
      return { success: false, error: "Categoria não encontrada." };
    if (message === "CATEGORY_HAS_TRANSACTIONS")
      return { success: false, error: "Não é possível eliminar uma categoria com transacções associadas." };
    if (isPrismaError(error) && error.code === "P2025")
      return { success: false, error: "Categoria já foi eliminada." };
    if (isPrismaError(error) && error.code === "P2003")
      return { success: false, error: "Não é possível eliminar uma categoria com transacções associadas." };
    console.error("[DELETE_CATEGORY_ERROR]:", error);
    return { success: false, error: "Erro ao eliminar categoria." };
  }
}