"use server";

import { RegisterChurchService } from "@/services/registerChurchService";
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
    await RegisterChurchService.registerChurch(result.data);
    return { success: true, slug: result.data.churchSlug };

  } catch (error: unknown) {
    // 👈 verifica SLUG_TAKEN primeiro
    if (error instanceof Error && error.message === "SLUG_TAKEN") {
      return {
        success: false,
        fieldErrors: { churchSlug: ["register.slugTaken"] },
      };
    }

    if (isPrismaError(error) && error.code === "P2002") {
      const targets = error.meta?.target as string[] | undefined;
      if (targets?.includes("slug")) {
        return {
          success: false,
          fieldErrors: { churchSlug: ["register.slugTaken"] },
        };
      }
      if (targets?.includes("email")) {
        return {
          success: false,
          fieldErrors: { adminEmail: ["register.emailTaken"] },
        };
      }
    }

    console.error("[REGISTER_CHURCH_ERROR]:", error);
    return { success: false, error: "register.errorCreate" };
  }
}