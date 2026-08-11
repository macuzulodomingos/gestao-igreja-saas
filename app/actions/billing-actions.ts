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
    message: "validation.invalidPlan",
  }),
  billingCycle: z.nativeEnum(BillingCycle),
  proofOfPayment: z.string().min(1, "validation.required"),
});

const rejectPaymentSchema = z.object({
  churchId: z.string().min(1),
  reason: z.string().min(3, "validation.reasonTooShort").max(500, "validation.reasonTooLong"),
});

export async function submitPaymentProofAction(formData: FormData, targetChurchId?: string): Promise<ActionResult> {
  try {
    const { churchId, actor, isSuperAdmin, role } = await getAuthContext(targetChurchId);

    // Só ADMIN/SUPER_ADMIN podem submeter comprovativo — decisão de plano/
    // assinatura é de nível administrativo, mesma fronteira já aplicada
    // em user-actions.ts (TREASURER/SECRETARY/OPERATOR não gerem a conta).
    if (!isSuperAdmin && role !== "ADMIN") {
      return { success: false, errorCode: "unauthorized" };
    }

    const result = submitProofSchema.safeParse(
      Object.fromEntries(formData.entries())
    );
    if (!result.success) {
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };
    }

    await BillingService.submitPaymentProof(churchId, actor, result.data);

    revalidatePath(`/[locale]/[slug]/billing`, "page");
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
    const { actor, isSuperAdmin } = await getAuthContext(churchId);
    if (!isSuperAdmin) return { success: false, errorCode: "unauthorized" };

    await BillingService.confirmPayment(churchId, actor);

    revalidatePath(`/[locale]/admin/billing`, "page");
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
    const validated = rejectPaymentSchema.safeParse({ churchId, reason });
    if (!validated.success) return { success: false, errorCode: "invalidData" };

    const { actor, isSuperAdmin } = await getAuthContext(validated.data.churchId);
    if (!isSuperAdmin) return { success: false, errorCode: "unauthorized" };

    await BillingService.rejectPayment(
      validated.data.churchId,
      actor,
      validated.data.reason
    );

    revalidatePath(`/[locale]/admin/billing`, "page");
    return { success: true };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED" || message === "CHURCH_ID_REQUIRED")
      return { success: false, errorCode: "unauthorized" };
    if (message === "NO_PENDING_PAYMENT")
      return { success: false, errorCode: "noPendingPayment" };
    console.error("[REJECT_PAYMENT_ERROR]:", error);
    return { success: false, errorCode: "errorReject" };
  }
}