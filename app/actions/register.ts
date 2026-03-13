"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";

const registerSchema = z.object({
  churchName: z.string().min(3, "Nome da igreja obrigatório").max(100),
  churchSlug: z.string()
    .min(3, "Slug obrigatório")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífens"),
  adminName: z.string().min(2, "Nome obrigatório").max(100),
  adminEmail: z.string().email("E-mail inválido"),
  adminPassword: z.string().min(6, "Mínimo 6 caracteres"),
});

export async function registerChurchAction(formData: FormData) {
  const result = registerSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!result.success) {
    return { success: false, fieldErrors: result.error.flatten().fieldErrors };
  }

  const { churchName, churchSlug, adminName, adminEmail, adminPassword } = result.data;

  try {
    // Verifica slug duplicado
    const existingChurch = await prisma.church.findUnique({
      where: { slug: churchSlug },
    });
    if (existingChurch) {
      return { success: false, fieldErrors: { churchSlug: ["Este slug já está em uso. Escolha outro."] } };
    }

    // Verifica email duplicado
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });
    if (existingUser) {
      return { success: false, fieldErrors: { adminEmail: ["Este e-mail já está registado."] } };
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Cria Igreja + Admin numa transacção
    await prisma.$transaction(async (tx) => {
      const church = await tx.church.create({
        data: {
          name: churchName,
          slug: churchSlug,
          plan: "FREE",
        },
      });

      await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: "ADMIN",
          churchId: church.id,
        },
      });

      // Cria categorias padrão
      await tx.financeCategory.createMany({
        data: [
          { name: "Dízimo", type: "INCOME", churchId: church.id },
          { name: "Oferta", type: "INCOME", churchId: church.id },
          { name: "Doação", type: "INCOME", churchId: church.id },
          { name: "Salários", type: "EXPENSE", churchId: church.id },
          { name: "Manutenção", type: "EXPENSE", churchId: church.id },
          { name: "Utilities", type: "EXPENSE", churchId: church.id },
        ],
      });

      // Cria cargos padrão
      await tx.memberRole.createMany({
        data: [
          { name: "Pastor", churchId: church.id },
          { name: "Diácono", churchId: church.id },
          { name: "Secretário", churchId: church.id },
          { name: "Tesoureiro", churchId: church.id },
        ],
      });
    });

    return { success: true, slug: churchSlug };

  } catch (error: any) {
    console.error("[REGISTER_CHURCH_ERROR]:", error);
    return { success: false, error: "Erro ao criar conta. Tente novamente." };
  }
}