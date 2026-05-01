"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth-context";
import { getErrorMessage, isPrismaError } from "@/lib/errors";
import { ChurchService } from "@/services/churchService";

const VALID_TIMEZONES = [
  "Africa/Luanda",
  "Africa/Kinshasa",
  "Africa/Lubumbashi",
  "America/Sao_Paulo",
  "America/Manaus",
  "Europe/Lisbon",
  "Africa/Maputo",
] as const;

const churchSettingsSchema = z.object({
  name: z.string().min(2, "validation.nameRequired").max(100, "validation.nameTooLong").trim(),
  timezone: z.enum(VALID_TIMEZONES),
});

export async function updateChurchSettingsAction(
  formData: FormData,
  targetChurchId?: string,
) {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    const result = churchSettingsSchema.safeParse(
      Object.fromEntries(formData.entries())
    );
    if (!result.success) {
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };
    }

    await ChurchService.updateSettings(churchId, actor, {
      name: result.data.name,
      timezone: result.data.timezone,
    });

    revalidatePath(`/[slug]`, "layout"); // 👈 limpa tudo de uma vez
    return { success: true };

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, errorCode: "unauthorized" };
    if (message === "CHURCH_ID_REQUIRED")
      return { success: false, errorCode: "unauthorized" };
    if (isPrismaError(error) && error.code === "P2002")
      return { success: false, errorCode: "nameTaken" };
    console.error("[UPDATE_CHURCH_SETTINGS_ERROR]:", error);
    return { success: false, errorCode: "errorSave" };
  }
}


