"use server";

import { auth } from "@/lib/auth";
import { FinanceService } from "@/services/financeService";
import { financeSchema } from "@/lib/validations/finance";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

/**
 * Helper privado — mesmo padrão do member-actions
 */
async function getAuthContext() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const churchId = session.user.churchId;
  if (!churchId) throw new Error("CHURCH_ID_REQUIRED");

  return {
    churchId,
    actor: {
      userId: session.user.id,
      email: session.user.email!,
    },
  };
}

// --- ACTION DE CRIAR / EDITAR ---
export async function saveTransactionAction(
  formData: FormData,
  transactionId?: string,
) {
  console.log("transactionId recebido:", transactionId);
  try {
    const { churchId, actor } = await getAuthContext();

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
    return { success: true };

  } catch (error: any) {
    console.error("[SAVE_TRANSACTION_ERROR]:", error);
    if (error.message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    return { success: false, error: "Falha ao registar transação." };
  }
}

// --- ACTION DE DELETAR ---
export async function deleteTransactionAction(id: string) {
  try {
    const { churchId } = await getAuthContext();

    await prisma.financeTransaction.deleteMany({
      where: { id, churchId }, // 🔒 Multi-tenant
    });

    revalidatePath(`/[slug]/financas`, "page");
    return { success: true };

  } catch (error: any) {
    console.error("[DELETE_TRANSACTION_ERROR]:", error);
    if (error.message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    return { success: false, error: "Não foi possível eliminar o registo." };
  }
}