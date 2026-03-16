"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Password obrigatória"),
});

export async function authenticate(formData: FormData) {
  try {
    const email = formData.get("email");
    const password = formData.get("password");

    // 👈 dentro da função
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) return "Credenciais inválidas.";

    await signIn("credentials", {
      email: result.data.email,
      password: result.data.password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "E-mail ou palavra-passe incorrectos.";
        default:
          return "Algo correu mal na autenticação.";
      }
    }
    throw error;
  }
}