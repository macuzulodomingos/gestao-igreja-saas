"use server";

import { BillingService } from "@/services/billingService";
import { getAuthContext } from "@/lib/auth-context";
import { getErrorMessage } from "@/lib/errors";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Plan, BillingCycle } from "@/app/generated/prisma/enums";
import { ActionResult } from "@/types/action-result";


const submitProofSchema = z.object({
  plan: z.nativeEnum(Plan).refine(p => p !== "FREE", {
    message: "Plano inválido" // 👈 FREE não pode ser comprado
  }),
  billingCycle: z.nativeEnum(BillingCycle),
  proofOfPayment: z.string().url("URL inválida"),
});

export async function submitPaymentProofAction(formData: FormData): Promise<ActionResult> {
  try {
    const { churchId, actor } = await getAuthContext();

    const result = submitProofSchema.safeParse(
      Object.fromEntries(formData.entries())
    );
    if (!result.success) {
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };
    }

    await BillingService.submitPaymentProof(churchId, actor, result.data);

    revalidatePath(`/[slug]/billing`, "page");
    return { success: true };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED" || message === "CHURCH_ID_REQUIRED")
      return { success: false, errorCode: "unauthorized" };
    console.error("[SUBMIT_PROOF_ERROR]:", error);
    return { success: false, errorCode: "errorSubmit" };
  }
}

export async function confirmPaymentAction(churchId: string): Promise<ActionResult> {
  try {
    const { actor, isSuperAdmin } = await getAuthContext();
    if (!isSuperAdmin) return { success: false, errorCode: "unauthorized" };

    await BillingService.confirmPayment(churchId, actor);

    revalidatePath(`/admin/billing`);
    return { success: true };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED" || message === "CHURCH_ID_REQUIRED")
      return { success: false, errorCode: "unauthorized" };
    if (message === "NO_PENDING_PAYMENT")
      return { success: false, errorCode: "noPendingPayment" };
    console.error("[CONFIRM_PAYMENT_ERROR]:", error);
    return { success: false, errorCode: "errorConfirm" };
  }
}

export async function rejectPaymentAction(churchId: string, reason: string): Promise<ActionResult> {
  try {

    const { actor, isSuperAdmin } = await getAuthContext();
    if (!isSuperAdmin) return { success: false, errorCode: "unauthorized" };

    await BillingService.rejectPayment(churchId, actor, reason);

    revalidatePath(`/admin/billing`);
    return { success: true };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED" || message === "CHURCH_ID_REQUIRED")
      return { success: false, errorCode: "unauthorized" };
    console.error("[REJECT_PAYMENT_ERROR]:", error);
    return { success: false, errorCode: "errorReject" };
  }
}