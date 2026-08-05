"use server";

import { auth } from "@/lib/auth";
import { ProfileService } from "@/services/profileService";
import { updateProfileSchema, changePasswordSchema } from "@/lib/validations/profile";
import { ActionResult } from "@/types/action-result";
import { revalidatePath } from "next/cache";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session.user;
}

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireSession();

    const result = updateProfileSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!result.success) {
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };
    }

    await ProfileService.updateName(user.id, result.data.name, {
      userId: user.id,
      email: user.email ?? "",
    });

    revalidatePath(`/[locale]/[slug]/configuracoes/perfil`, "page");
    return { success: true };

  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { success: false, errorCode: "unauthorized" };
    }
    console.error("[UPDATE_PROFILE_ERROR]:", error);
    return { success: false, errorCode: "errorSave" };
  }
}

export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireSession();

    const result = changePasswordSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!result.success) {
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };
    }

    await ProfileService.changePassword(
      user.id,
      result.data.currentPassword,
      result.data.newPassword,
      { userId: user.id, email: user.email ?? "" }
    );

    return { success: true };

  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { success: false, errorCode: "unauthorized" };
    }
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return { success: false, errorCode: "userNotFound" };
    }
    if (error instanceof Error && error.message === "WRONG_CURRENT_PASSWORD") {
      return {
        success: false,
        fieldErrors: { currentPassword: ["profile.errors.wrongCurrentPassword"] },
      };
    }
    console.error("[CHANGE_PASSWORD_ERROR]:", error);
    return { success: false, errorCode: "errorSave" };
  }
}