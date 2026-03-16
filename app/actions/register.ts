"use server";

import { z } from "zod";
import { ChurchService } from "@/services/churchService";

const registerSchema = z.object({
  churchName: z.string().min(3, "Nome da igreja obrigatório").max(100),
  churchSlug: z.string()
    .min(3, "Slug obrigatório")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífens"),
  adminName: z.string().min(2, "Nome obrigatório").max(100),
  adminEmail: z.string().email("E-mail inválido"),
  adminPassword: z.string().min(6, "Mínimo 6 caracteres"),
});

export async function registerChurchAction(formData: FormData) {
  const result = registerSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!result.success) {
    return { success: false, fieldErrors: result.error.flatten().fieldErrors };
  }

  try {
    await ChurchService.registerChurch(result.data);
    return { success: true, slug: result.data.churchSlug };

  } catch (error: any) {
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0];
      if (field === "slug") {
        return { success: false, fieldErrors: { churchSlug: ["Este slug já está em uso. Escolha outro."] } };
      }
      if (field === "email") {
        return { success: false, fieldErrors: { adminEmail: ["Este e-mail já está registado."] } };
      }
    }
    console.error("[REGISTER_CHURCH_ERROR]:", error);
    return { success: false, error: "Erro ao criar conta. Tente novamente." };
  }
}