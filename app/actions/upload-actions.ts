"use server";

import { supabaseServer } from "@/lib/supabase-server";
import { auth } from "@/lib/auth";
import type { ActionResultWithUrl } from "@/types/action-result";

export async function uploadPaymentProofAction(
  formData: FormData
): Promise<ActionResultWithUrl> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, errorCode: "unauthorized" };

    const file = formData.get("file") as File;
    if (!file) return { success: false, errorCode: "fileNotFound" };

    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.type))
      return { success: false, errorCode: "invalidFileType" };

    if (file.size > 5 * 1024 * 1024)
      return { success: false, errorCode: "errorFileSize" };

    const fileExt = file.name.split(".").pop();
    const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;

    const { data, error } = await supabaseServer.storage
      .from("payment-proofs")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("[UPLOAD_ERROR]:", error);
      return { success: false, errorCode: "errorUpload" };
    }

    // Salva só o caminho do arquivo — não uma URL assinada, que expira.
    // A URL é gerada sob demanda, no momento de exibir o comprovativo.
    return { success: true, url: data.path };

  } catch (error: unknown) {
    console.error("[UPLOAD_PAYMENT_PROOF_ERROR]:", error);
    return { success: false, errorCode: "errorUpload" };
  }
}