"use server";

import { FinanceService } from "@/services/financeService";
import { financeSchema } from "@/lib/validations/finance";
import { revalidatePath, updateTag } from "next/cache";
import { getAuthContext } from "@/lib/auth-context";
import { getErrorMessage, isPrismaError } from "@/lib/errors";
import { fromZonedTime } from "date-fns-tz";
import { getTimezone } from "@/lib/get-timezone";
import { checkTransactionMonthlyLimit } from "@/lib/plan-guard";
import { FinanceTransaction } from "@/types/finance";

type LoadMoreResult =
  | { success: true; data: FinanceTransaction[]; nextCursor: string | null; hasMore: boolean }
  | { success: false; error: string };

export async function saveTransactionAction(
  formData: FormData,
  transactionId?: string,
  targetChurchId?: string,
) {
  try {
    const { churchId, actor, plan } = await getAuthContext(targetChurchId);


    const result = financeSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!result.success) {
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };
    }

    const timezone = await getTimezone(churchId);

    const dateUTC = fromZonedTime(
      `${result.data.date}T12:00:00`,
      timezone
    );


    if (transactionId) {
      await FinanceService.updateTransaction(transactionId, churchId, actor, {
        ...result.data,
        date: dateUTC,
      });
    } else {
      await checkTransactionMonthlyLimit(churchId, plan);
      await FinanceService.createTransaction(churchId, actor, {
        ...result.data,
        date: dateUTC,
      });
    }

    revalidatePath(`/[slug]/financas`, "page");
    updateTag(`finances-${churchId}`);
    updateTag(`church-${churchId}`);
    return { success: true };

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    if (message === "CHURCH_ID_REQUIRED")
      return { success: false, error: "Igreja não encontrada." };
    if (message === "INVALID_AMOUNT")
      return { success: false, error: "O valor deve ser maior que zero." };
    if (message === "INVALID_CATEGORY")
      return { success: false, error: "Categoria inválida para esta igreja." };
    if (message === "CATEGORY_TYPE_MISMATCH")
      return { success: false, error: "A categoria não corresponde ao tipo de transacção." };
    if (message === "TRANSACTION_NOT_FOUND")
      return { success: false, error: "Transacção não encontrada." };
    if (message === "PLAN_LIMIT_TRANSACTIONS")
      return { success: false, error: "Limite de transacções mensais atingido. Actualize o seu plano.", upgrade: true };
    if (isPrismaError(error) && error.code === "P2025")
      return { success: false, error: "Registo não encontrado." };
    console.error("[SAVE_TRANSACTION_ERROR]:", error);
    return { success: false, error: "Falha ao registar transacção." };
  }
}

export async function deleteTransactionAction(
  id: string,
  targetChurchId?: string,
) {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    await FinanceService.deleteTransaction(id, churchId, actor);

    revalidatePath(`/[slug]/financas`, "page");
    updateTag(`finances-${churchId}`);
    updateTag(`church-${churchId}`);
    return { success: true };

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    if (message === "TRANSACTION_NOT_FOUND")
      return { success: false, error: "Transacção não encontrada." };
    if (isPrismaError(error) && error.code === "P2025")
      return { success: false, error: "Transacção já foi eliminada." };
    console.error("[DELETE_TRANSACTION_ERROR]:", error);
    return { success: false, error: "Não foi possível eliminar o registo." };
  }
}


export async function loadMoreTransactionsAction(
  type: "INCOME" | "EXPENSE",
  month: number,
  year: number,
  cursor: string,
  targetChurchId?: string,
): Promise<LoadMoreResult> {
  try {
    const { churchId } = await getAuthContext(targetChurchId);
    const timezone = await getTimezone(churchId);

    const result = await FinanceService.getTransactions(
      churchId,
      20,
      type,
      month,
      year,
      timezone,
      cursor
    );

    return {
      success: true,
      data: result.data,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  } catch (error: unknown) {
    console.error("[LOAD_MORE_ERROR]:", error);
    return { success: false, error: "Erro ao carregar mais transacções." };
  }
}