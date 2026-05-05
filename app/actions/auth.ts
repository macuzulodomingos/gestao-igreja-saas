"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";


const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Password obrigatória"),
});

export async function authenticate(formData: FormData) {
  try {
    const result = loginSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!result.success) return { errorCode: "invalidCredentials" };

    await signIn("credentials", {
      email: result.data.email,
      password: result.data.password,
      redirect: false, // 👈 sem redirect automático
    });

    // 👈 busca o locale do utilizador ANTES de fazer login
    const user = await prisma.user.findUnique({
      where: { email: result.data.email },
      select: { locale: true, role: true, church: { select: { slug: true } } },
    });

    // 👈 retorna locale e destino para o cliente redirecionar
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
          return { errorCode: "invalidCredentials" };
        default:
          return { errorCode: "authError" };
      }
    }
    console.error("[LOGIN_ERROR]:", error); 
    return { errorCode: "authError" }; 
  }
}