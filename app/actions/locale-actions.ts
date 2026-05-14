"use server";

import { auth } from "@/lib/auth";
import { UserService } from "@/services/userService";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { ActionResult } from "@/types/action-result";

export async function updateLocaleAction(locale: "pt" | "fr"): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, errorCode: "unauthorized" };

    await UserService.updateLocale(session.user.id, locale);

      // 👈 guarda no cookie — o middleware consegue ler
    const cookieStore = await cookies();
    cookieStore.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    revalidatePath("/", "layout");
    return { success: true };

  } catch (error: unknown) {
    console.error("[UPDATE_LOCALE_ERROR]:", error);
    return { success: false, errorCode: "errorSave" };
  }
}