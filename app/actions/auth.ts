"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Password obrigatória"),
});

export async function authenticate(formData: FormData) {
  try {
    const email = formData.get("email");
    const password = formData.get("password");

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) return { error: "Credenciais inválidas." };

    // 👈 busca o locale do utilizador ANTES de fazer login
    const user = await prisma.user.findUnique({
      where: { email: result.data.email },
      select: { locale: true, role: true, church: { select: { slug: true } } },
    });

    await signIn("credentials", {
      email: result.data.email,
      password: result.data.password,
      redirect: false, // 👈 sem redirect automático
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
          return { error: "E-mail ou palavra-passe incorrectos." };
        default:
          return { error: "Algo correu mal na autenticação." };
      }
    }
    throw error;
  }
}