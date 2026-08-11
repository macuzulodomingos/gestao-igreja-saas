"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase-server";
import type { ActionResultWithUrl } from "@/types/action-result";

export async function getPaymentProofUrlAction(path: string): Promise<ActionResultWithUrl> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return { success: false, errorCode: "unauthorized" };
    }

    const subscription = await prisma.subscription.findFirst({
      where: { proofOfPayment: path },
      select: { id: true },
    });

    if (!subscription) {
      return { success: false, errorCode: "unauthorized" };
    }

    const { data, error } = await supabaseServer.storage
      .from("payment-proofs")
      .createSignedUrl(path, 60 * 60); // 1 hora — só o tempo de visualizar agora

    if (error || !data?.signedUrl) {
      console.error("[GET_PROOF_URL_ERROR]:", error);
      return { success: false, errorCode: "errorLoad" };
    }

    return { success: true, url: data.signedUrl };

  } catch (error: unknown) {
    console.error("[GET_PAYMENT_PROOF_URL_ERROR]:", error);
    return { success: false, errorCode: "errorLoad" };
  }
}