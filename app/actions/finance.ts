"use server";

import { auth } from "@/lib/auth";
import { FinanceService } from "@/services/financeService";
import { financeSchema } from "@/lib/validations/finance";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma"; // 👈 estava a faltar

export async function saveTransactionAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.churchId) {
    return { success: false, error: "Não autorizado ou sessão expirada." };
  }

  const { churchId, id: userId, email } = session.user;

  try {
    const rawData = Object.fromEntries(formData.entries());
    const result = financeSchema.safeParse(rawData);

    if (!result.success) {
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };
    }

    const actor = { userId, email: email! };
    await FinanceService.createTransaction(churchId, actor, result.data);

    revalidatePath("/[slug]/financas", "page");
    return { success: true };

  } catch (error: unknown) {
    console.error("[SAVE_TRANSACTION_ERROR]:", error);
    return { success: false, error: "Falha ao registar transação." };
  }
}

export async function deleteTransactionAction(id: string) {
  const session = await auth();

  if (!session?.user?.churchId) {
    return { success: false, error: "Não autorizado." };
  }

  try {
    // 🔒 Multi-tenant: garante que só apaga da igreja correcta
    await prisma.financeTransaction.deleteMany({
      where: { id, churchId: session.user.churchId },
    });

    revalidatePath("/[slug]/financas", "page");
    return { success: true };

  } catch (error) {
    console.error("Erro ao eliminar:", error);
    return { success: false, error: "Não foi possível eliminar o registo." };
  }
}