"use server";

import { BillingService } from "@/services/billingService";
import { getAuthContext } from "@/lib/auth-context";
import { getErrorMessage } from "@/lib/errors";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PlanType } from "@/lib/plans";

const submitProofSchema = z.object({
  plan: z.enum(["PRO", "ENTERPRISE"]),
  billingCycle: z.enum(["MONTHLY", "ANNUAL"]),
  proofOfPayment: z.string().url("URL inválida"),
});

export async function submitPaymentProofAction(formData: FormData) {
  try {
    const { churchId, actor } = await getAuthContext();

    const result = submitProofSchema.safeParse(
      Object.fromEntries(formData.entries())
    );
    if (!result.success) {
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };
    }

    await BillingService.submitPaymentProof(churchId, actor, result.data);

    revalidatePath(`/[slug]/billing`);
    return { success: true };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    console.error("[SUBMIT_PROOF_ERROR]:", error);
    return { success: false, error: "Erro ao submeter comprovativo." };
  }
}

export async function confirmPaymentAction(churchId: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN")
      return { success: false, error: "Sem permissão." };

    const actor = { userId: session.user.id, email: session.user.email! };
    await BillingService.confirmPayment(churchId, actor);

    revalidatePath(`/admin/billing`);
    return { success: true };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "NO_PENDING_PAYMENT")
      return { success: false, error: "Sem pagamento pendente." };
    console.error("[CONFIRM_PAYMENT_ERROR]:", error);
    return { success: false, error: "Erro ao confirmar pagamento." };
  }
}

export async function rejectPaymentAction(churchId: string, reason: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN")
      return { success: false, error: "Sem permissão." };

    const actor = { userId: session.user.id, email: session.user.email! };
    await BillingService.rejectPayment(churchId, actor, reason);

    revalidatePath(`/admin/billing`);
    return { success: true };
  } catch (error: unknown) {
    console.error("[REJECT_PAYMENT_ERROR]:", error);
    return { success: false, error: "Erro ao rejeitar pagamento." };
  }
}