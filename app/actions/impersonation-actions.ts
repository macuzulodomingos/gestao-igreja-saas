"use server";

import { auth } from "@/lib/auth";
import { ImpersonationService } from "@/services/impersonationService";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { getErrorMessage } from "@/lib/errors";

const startSchema = z.object({
  reason: z.string().min(10, "Mínimo 10 caracteres").max(500),
});

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN")
    throw new Error("UNAUTHORIZED");
  return session;
}

export async function startImpersonationAction(
  churchId: string,
  churchSlug: string,
  formData: FormData
) {
  let targetUrl = "";
  try {
    const session = await requireSuperAdmin();

    const result = startSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!result.success)
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };

    await ImpersonationService.startImpersonation(
      session.user.id,
      churchId,
      result.data.reason
    );

    const cookieStore = await cookies();
    cookieStore.set("impersonated_church_slug", churchSlug, {
      maxAge: 60 * 60,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    revalidatePath("/", "layout");
    const locale = await getLocale();
    targetUrl = `/${locale}/${churchSlug}/painel`;
  } catch (error) {
    console.error("[START_IMPERSONATION_ERROR]:", error);
    return { success: false };
  }

  if (targetUrl) redirect(targetUrl);
}

export async function endImpersonationAction(sessionId: string) {
  let targetUrl = "";
  try {
    const session = await requireSuperAdmin();

    await ImpersonationService.endImpersonation(sessionId, session.user.id);

    const cookieStore = await cookies();
    cookieStore.delete("impersonated_church_slug");

    revalidatePath("/", "layout");
    const locale = await getLocale();
    targetUrl = `/${locale}/admin`;
  } catch (error) {
    const message = getErrorMessage(error);
    if (message === "NEXT_REDIRECT") throw error;
    console.error("[END_IMPERSONATION_ERROR]:", error);
  }

  if (targetUrl) redirect(targetUrl);
}