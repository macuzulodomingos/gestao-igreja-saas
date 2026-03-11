"use server";

import { auth } from "@/lib/auth";
import { FinanceCategoryService } from "@/services/financeCategoryService";
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

const categorySchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(50, "Máximo 50 caracteres"),
  type: z.enum(["INCOME", "EXPENSE"]),
});

export async function saveCategoryAction(
  formData: FormData,
  categoryId?: string,
  targetChurchId?: string,
) {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    const result = categorySchema.safeParse(
      Object.fromEntries(formData.entries())
    );

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

  } catch (error: any) {
    console.error("[SAVE_CATEGORY_ERROR]:", error);
    if (error.message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    return { success: false, error: error.message || "Erro ao salvar categoria." };
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

  } catch (error: any) {
    console.error("[DELETE_CATEGORY_ERROR]:", error);
    if (error.message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    return { success: false, error: error.message || "Erro ao eliminar categoria." };
  }
}