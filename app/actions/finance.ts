"use server";

import { auth } from "@/lib/auth";
import { FinanceService } from "@/services/financeService";
import { financeSchema } from "@/lib/validations/finance";
import { revalidatePath } from "next/cache";

/**
 * Action para criar ou atualizar transações financeiras.
 */
export async function saveTransactionAction(formData: FormData) {
  const session = await auth();
  
  // 1. Verificação de Autenticação
  if (!session?.user?.churchId) {
    return { success: false, error: "Não autorizado ou sessão expirada." };
  }

  const { churchId, id: userId, email } = session.user;

  try {
    // 2. Validação com Zod
    const rawData = Object.fromEntries(formData.entries());
    const result = financeSchema.safeParse(rawData);

    if (!result.success) {
      return {
        success: false,
        fieldErrors: result.error.flatten().fieldErrors,
      };
    }

    // 3. Chamada ao Service
    // O actor é necessário para o AuditLog que criamos no Service
    const actor = { userId, email: email! };
    
    await FinanceService.createTransaction(churchId, actor, result.data);

    // 4. Revalidação da Cache
    // Isso garante que os números no dashboard atualizem na hora
    revalidatePath("/[slug]/financas", "page");
    
    return { success: true };

  } catch (error: unknown) {
    console.error("[SAVE_TRANSACTION_ERROR]:", error);
    
    return { 
      success: false, 
      error: "Falha ao registar transação. Por favor, tente novamente." 
    };
  }
}


// Esta é a função que estava a faltar e causou o erro:
export async function deleteTransactionAction(id: string) {
  try {
    await prisma.financeTransaction.delete({
      where: { id },
    });

    // Força a página a atualizar os dados do servidor
    revalidatePath("/[slug]/financas", "page");
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao eliminar:", error);
    return { success: false, error: "Não foi possível eliminar o registo." };
  }
}