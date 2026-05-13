"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";

// 👈 tipo específico para o authenticate
type AuthResult =
  | { success: true; redirectTo: string }
  | { success: false; errorCode: string };

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Password obrigatória"),
});

export async function authenticate(formData: FormData): Promise<AuthResult> {
  try {
    const result = loginSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!result.success) return { success: false, errorCode: "invalidCredentials" }; // 👈

    await signIn("credentials", {
      email: result.data.email,
      password: result.data.password,
      redirect: false,
    });

    const user = await prisma.user.findUnique({
      where: { email: result.data.email },
      select: { locale: true, role: true, church: { select: { slug: true } } },
    });

    const locale = user?.locale ?? "pt";
    const slug = user?.church?.slug;
    const role = user?.role;

    if (role === "SUPER_ADMIN") {
      return { success: true, redirectTo: `/${locale}/admin` };
    }

    if (slug) {
      return { success: true, redirectTo: `/${locale}/${slug}/painel` };
    }

    return { success: true, redirectTo: `/${locale}` };

  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, errorCode: "invalidCredentials" }; // 👈
        default:
          return { success: false, errorCode: "authError" }; // 👈
      }
    }
    console.error("[LOGIN_ERROR]:", error);
    return { success: false, errorCode: "authError" }; // 👈
  }
}