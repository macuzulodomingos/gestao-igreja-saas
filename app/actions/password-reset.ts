"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { headers } from "next/headers";
import { requestResetSchema, resetPasswordSchema } from "@/lib/validations/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";
import { passwordResetIpLimit, passwordResetEmailLimit } from "@/lib/rate-limit";
import { ActionResult } from "@/types/action-result";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

function generateRawToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function requestPasswordResetAction(
  formData: FormData,
  locale: "pt" | "fr"
): Promise<ActionResult> {
  try {
    const result = requestResetSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!result.success) {
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };
    }

    const email = result.data.email;

    // Identifica o IP do pedido, para o limite por IP
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? headersList.get("x-real-ip")
      ?? "unknown";

    // Verifica os dois limites em paralelo — se qualquer um estourar,
    // recusa o pedido. A resposta continua genérica (sempre "sucesso"
    // do ponto de vista do utilizador) para não revelar que existe
    // limitação, seguindo o mesmo princípio de anti-enumeração já usado.
    const [ipResult, emailResult] = await Promise.all([
      passwordResetIpLimit.limit(ip),
      passwordResetEmailLimit.limit(email),
    ]);

    if (!ipResult.success || !emailResult.success) {
      console.warn("[PASSWORD_RESET_RATE_LIMITED]:", { ip, email, ipResult, emailResult });
      // Resposta idêntica ao caso de sucesso — não revela que foi bloqueado
      return { success: true };
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, deletedAt: true },
    });

    // 🔒 Nunca revela se o email existe ou não — sempre retorna sucesso
    // genérico, mesmo que o utilizador não exista ou esteja desactivado.
    // Isso evita enumeração de contas por terceiros mal-intencionados.
    if (!user || user.deletedAt) {
      return { success: true };
    }

    // Invalida tokens anteriores ainda válidos deste utilizador —
    // evita acumular múltiplos tokens activos simultaneamente
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });

    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/${locale}/redefinir-senha?token=${rawToken}`;

    await sendPasswordResetEmail({
      to: email,
      resetUrl,
      locale,
      userName: user.name ?? email,
    });

    return { success: true };

  } catch (error: unknown) {
    console.error("[REQUEST_PASSWORD_RESET_ERROR]:", error);
    // Mesmo em erro interno, não revela detalhes — resposta genérica
    return { success: true };
  }
}

export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  try {
    const result = resetPasswordSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!result.success) {
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };
    }

    const tokenHash = hashToken(result.data.token);

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return { success: false, errorCode: "invalidToken" };
    }

    const hashedPassword = await bcrypt.hash(result.data.password, 12);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      });

      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          userId: resetToken.userId,
          action: "RESET_PASSWORD",
          entityName: "User",
          entityId: resetToken.userId,
          newData: { via: "email_token" },
        },
      });
    });

    return { success: true };

  } catch (error: unknown) {
    console.error("[RESET_PASSWORD_ERROR]:", error);
    return { success: false, errorCode: "errorSave" };
  }
}