"use server";

import { auth } from "@/lib/auth";
import { ImpersonationService } from "@/services/impersonationService";
import { getErrorMessage } from "@/lib/errors";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import type { ActionResult } from "@/types/action-result";

const startSchema = z.object({
  reason: z.string().min(10, "Motivo obrigatório — mínimo 10 caracteres").max(500),
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
): Promise<ActionResult> {
  try {
    const session = await requireSuperAdmin();

    const result = startSchema.safeParse(
      Object.fromEntries(formData.entries())
    );
    if (!result.success)
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };

    await ImpersonationService.startImpersonation(
      session.user.id,
      churchId,
      result.data.reason
    );

    const locale = await getLocale();
    redirect(`/${locale}/${churchSlug}/painel`);
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, errorCode: "unauthorized" };
    console.error("[START_IMPERSONATION_ERROR]:", error);
    return { success: false, errorCode: "errorSave" };
  }
}

export async function endImpersonationAction(
  sessionId: string
): Promise<ActionResult> {
  try {
    const session = await requireSuperAdmin();

    await ImpersonationService.endImpersonation(sessionId, session.user.id);

    const locale = await getLocale();
    redirect(`/${locale}/admin`);
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, errorCode: "unauthorized" };
    if (message === "IMPERSONATION_NOT_FOUND")
      return { success: false, errorCode: "notFound" };
    console.error("[END_IMPERSONATION_ERROR]:", error);
    return { success: false, errorCode: "errorSave" };
  }
}