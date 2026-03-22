"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth-context";
import { getErrorMessage } from "@/lib/errors";

const churchSettingsSchema = z.object({
  timezone: z.enum([
    "Africa/Luanda",
    "Africa/Kinshasa",
    "Africa/Lubumbashi",
    "America/Sao_Paulo",
    "America/Manaus",
    "Europe/Lisbon",
    "Africa/Maputo",
  ]),
});

export async function updateChurchTimezoneAction(
  formData: FormData,
  targetChurchId?: string,
) {
  try {
    const { churchId } = await getAuthContext(targetChurchId);

    const result = churchSettingsSchema.safeParse(
      Object.fromEntries(formData.entries())
    );
    if (!result.success) {
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };
    }

    await prisma.church.update({
      where: { id: churchId },
      data: { timezone: result.data.timezone },
    });

    revalidatePath(`/[slug]/configuracoes`, "page");
    revalidatePath(`/[slug]/eventos`, "page");
    return { success: true };

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    if (message === "CHURCH_ID_REQUIRED")
      return { success: false, error: "Igreja não encontrada." };
    console.error("[UPDATE_CHURCH_TIMEZONE_ERROR]:", error);
    return { success: false, error: "Erro ao actualizar timezone." };
  }
}