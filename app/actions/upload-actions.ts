"use server";

import { supabaseServer } from "@/lib/supabase-server";
import { auth } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export async function uploadPaymentProofAction(formData: FormData) {
  // 👈 TEMPORÁRIO — verifica se as env vars estão a ser lidas
  console.log("SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("SERVICE_KEY exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log("SERVICE_KEY prefix:", process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20));
  
  const session = await auth();
  if (!session?.user) return { success: false, error: "Não autenticado." };

  const file = formData.get("file") as File;
  if (!file) return { success: false, error: "Ficheiro não encontrado." };

  // Valida tipo
  const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
  if (!allowed.includes(file.type))
    return { success: false, error: "Formato não permitido." };

  // Valida tamanho — 5MB
  if (file.size > 5 * 1024 * 1024)
    return { success: false, error: "Ficheiro demasiado grande. Máximo 5MB." };

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
    return { success: false, error: "Erro ao fazer upload." };
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

  // 👈 ver o path exacto retornado
console.log("[UPLOAD_SUCCESS] data:", data);
console.log("[UPLOAD_SUCCESS] path:", data.path);
console.log("[UPLOAD_SUCCESS] fullPath:", data.fullPath);
  

  // URL assinada válida por 7 dias
const { data: signedUrlData, error: signedUrlError } = await supabaseServer.storage
  .from("payment-proofs")
  .createSignedUrl(data.path, 60 * 60 * 24 * 7);

console.log("[SIGNED_URL] data:", signedUrlData);
console.log("[SIGNED_URL] error:", signedUrlError);

if (signedUrlError || !signedUrlData?.signedUrl) {
  console.error("[SIGNED_URL_ERROR]:", signedUrlError);
  return { success: false, error: "Erro ao gerar URL do comprovativo." };
}

return { success: true, url: signedUrlData.signedUrl };
}