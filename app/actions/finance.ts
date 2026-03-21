"use server";

import { auth } from "@/lib/auth";
import { FinanceService } from "@/services/financeService";
import { financeSchema } from "@/lib/validations/finance";
import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";
import { getAuthContext } from "@/lib/auth-context";


// --- ACTION DE CRIAR / EDITAR ---
export async function saveTransactionAction(
  formData: FormData,
  transactionId?: string,
  targetChurchId?: string, // 👈 para o super admin
) {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    const result = financeSchema.safeParse(
      Object.fromEntries(formData.entries()),
    );
    if (!result.success) {
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };
    }

    const dateUTC = new Date(`${result.data.date}T12:00:00Z`);

    if (transactionId) {
      await FinanceService.updateTransaction(transactionId, churchId, actor, {
        ...result.data,
        date: dateUTC,
      });
    } else {
      await FinanceService.createTransaction(churchId, actor, {
        ...result.data,
        date: dateUTC,
      });
    }

    revalidatePath(`/[slug]/financas`, "page");
    updateTag(`finances-${churchId}`);
    updateTag(`church-${churchId}`);
    return { success: true };

  } catch (error: any) {
    console.error("[SAVE_TRANSACTION_ERROR]:", error);
    if (error.message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    return { success: false, error: "Falha ao registar transação." };
  }
}

// --- ACTION DE DELETAR ---
export async function deleteTransactionAction(
  id: string,
  targetChurchId?: string,
) {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    await FinanceService.deleteTransaction(id, churchId, actor); // 👈 usa o service

    revalidatePath(`/[slug]/financas`, "page");
    updateTag(`finances-${churchId}`);
    updateTag(`church-${churchId}`);
    return { success: true };

  } catch (error: any) {
    console.error("[DELETE_TRANSACTION_ERROR]:", error);
    if (error.message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    return { success: false, error: "Não foi possível eliminar o registo." };
  }
}