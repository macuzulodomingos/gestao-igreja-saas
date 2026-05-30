"use server";

import { auth } from "@/lib/auth";
import { ImpersonationService } from "@/services/impersonationService";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { getErrorMessage } from "@/lib/errors";
import { ActionResult } from "@/types/action-result";

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
): Promise<ActionResult | void> {
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
    if (getErrorMessage(error) === "NEXT_REDIRECT") throw error;
    console.error("[START_IMPERSONATION_ERROR]:", error);
    return { success: false, errorCode: "errorStartImpersonation" };
  }

  if (targetUrl) redirect(targetUrl);
}

export async function endImpersonationAction(): Promise<void> {
  let targetUrl = "";
  try {
    const session = await requireSuperAdmin();
    const cookieStore = await cookies();

    const impersonatedSlug = cookieStore.get("impersonated_church_slug")?.value;

    if (impersonatedSlug) {
      // Fecha sessão mesmo que já tenha expirado pelo tempo
      await ImpersonationService.endImpersonationBySlug(session.user.id, impersonatedSlug);
    }

    // Limpa o cookie em qualquer cenário
    cookieStore.delete("impersonated_church_slug");

    revalidatePath("/", "layout");
    const locale = await getLocale();
    targetUrl = `/${locale}/admin`;
  } catch (error) {
    const message = getErrorMessage(error);
    if (message === "NEXT_REDIRECT") throw error;
    console.error("[END_IMPERSONATION_ERROR]:", error);
    return;
  }

  if (targetUrl) redirect(targetUrl);
}