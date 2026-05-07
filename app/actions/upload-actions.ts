"use server";

import { supabaseServer } from "@/lib/supabase-server";
import { auth } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export async function uploadPaymentProofAction(formData: FormData) {
  
  const session = await auth();
  if (!session?.user) return { success: false, errorCode: "unauthorized" };

  const file = formData.get("file") as File;
  if (!file) return { success: false, errorCode: "fileNotFound" };

  // Valida tipo
  const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
  if (!allowed.includes(file.type))
    return { success: false, errorCode: "invalidFileType" };

  // Valida tamanho — 5MB
  if (file.size > 5 * 1024 * 1024)
    return { success: false, errorCode: "errorUpload"  };

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
    return { success: false, errorCode: "Erro ao fazer upload." };
  }

  // 👈 cria cliente fresco para o signed URL — evita problema de estado
  const freshClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    }
  );

  

  // URL assinada válida por 7 dias
const { data: signedUrlData, error: signedUrlError } = await supabaseServer.storage
  .from("payment-proofs")
  .createSignedUrl(data.path, 60 * 60 * 24 * 7);


if (signedUrlError || !signedUrlData?.signedUrl) {
  console.error("[SIGNED_URL_ERROR]:", signedUrlError);
  return { success: false, errorCode: "errorUpload" };
}

return { success: true, url: signedUrlData.signedUrl };
}