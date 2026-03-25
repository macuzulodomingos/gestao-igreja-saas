"use server";

import { ChurchService } from "@/services/churchService";
import { Prisma } from "@prisma/client";
import { isPrismaError } from "@/lib/errors";
import { registerSchema } from "@/lib/validations/register";



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

  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2002") {
      const targets = error.meta?.target as string[] | undefined;

      if (targets?.includes("slug")) {
        return {
          success: false,
          fieldErrors: { churchSlug: ["Este slug já está em uso."] },
        };
      }

      if (targets?.includes("email")) {
        return {
          success: false,
          fieldErrors: { adminEmail: ["Este e-mail já está registado."] },
        };
      }
    }

    // 👇 AGORA SEMPRE EXECUTA
    console.error("[REGISTER_CHURCH_ERROR]:", error);
    return { success: false, error: "Erro ao criar conta. Tente novamente." };
  }
}