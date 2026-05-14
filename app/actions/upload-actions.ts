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
      return { success: false, errorCode: "errorFileSize" }; // 👈 código mais descritivo

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

    const { data: signedUrlData, error: signedUrlError } =
      await supabaseServer.storage
        .from("payment-proofs")
        .createSignedUrl(data.path, 60 * 60 * 24 * 7);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("[SIGNED_URL_ERROR]:", signedUrlError);
      return { success: false, errorCode: "errorUpload" };
    }

    return { success: true, url: signedUrlData.signedUrl };

  } catch (error: unknown) {
    console.error("[UPLOAD_PAYMENT_PROOF_ERROR]:", error);
    return { success: false, errorCode: "errorUpload" };
  }
}