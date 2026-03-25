"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { UserService } from "@/services/userService";
import { revalidatePath } from "next/cache";
import { checkUserLimit } from "@/lib/plan-guard";
import prisma from "@/lib/prisma";
import { PlanType } from "@/lib/plans";

const ALLOWED_ROLES = ["TREASURER", "SECRETARY", "OPERATOR"] as const;

const createUserSchema = z.object({
  name: z.string().min(2, "Nome obrigatório").max(100),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  role: z.enum(ALLOWED_ROLES, { errorMap: () => ({ message: "Cargo inválido" }) }),
});

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(ALLOWED_ROLES).optional(),
});

async function getAuthContext(targetChurchId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const churchId = isSuperAdmin && targetChurchId
    ? targetChurchId
    : session.user.churchId;

  if (!churchId) throw new Error("CHURCH_ID_REQUIRED");

  // Só ADMIN e SUPER_ADMIN podem gerir utilizadores
  if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role!)) {
    throw new Error("FORBIDDEN");
  }

  // 👈 busca plan junto com churchId — uma única query
  const church = await prisma.church.findUnique({
    where: { id: churchId },
    select: { plan: true },
  });

  return {
    churchId,
    plan: (church?.plan ?? "FREE") as PlanType, // 👈 NOVO
    actor: {
      userId: session.user.id,
      email: session.user.email!,
    },
    isSuperAdmin,
  };
}

export async function createUserAction(formData: FormData, targetChurchId?: string) {
  try {
    const { churchId, actor, plan } = await getAuthContext(targetChurchId);

    await checkUserLimit(churchId, plan);

    const result = createUserSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!result.success) {
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };
    }

    await UserService.createUser(churchId, actor, result.data);

    revalidatePath(`/[slug]/configuracoes/utilizadores`, "page");
    return { success: true };
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    if (error.message === "FORBIDDEN")
      return { success: false, error: "Sem permissão." };
    if (error.code === "P2002")
      return { success: false, fieldErrors: { email: ["Este e-mail já está registado."] } };
    if (message === "PLAN_LIMIT_USERS")
      return { success: false, error: "Limite de utilizadores atingido. Actualize o seu plano.", upgrade: true };
    console.error("[CREATE_USER_ERROR]:", error);
    return { success: false, error: "Erro ao criar utilizador." };
  }
}

export async function updateUserAction(
  userId: string,
  formData: FormData,
  targetChurchId?: string
) {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    const result = updateUserSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!result.success) {
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };
    }

    await UserService.updateUser(userId, churchId, actor, result.data);

    revalidatePath(`/[slug]/configuracoes/utilizadores`, "page");
    return { success: true };
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    if (error.message === "FORBIDDEN")
      return { success: false, error: "Sem permissão." };
    if (error.message === "CANNOT_EDIT_SELF")
      return { success: false, error: "Não pode editar a sua própria conta aqui." };
    if (error.message === "USER_NOT_FOUND")
      return { success: false, error: "Utilizador não encontrado." };
    console.error("[UPDATE_USER_ERROR]:", error);
    return { success: false, error: "Erro ao actualizar utilizador." };
  }
}

export async function deleteUserAction(userId: string, targetChurchId?: string) {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    await UserService.deleteUser(userId, churchId, actor);

    revalidatePath(`/[slug]/configuracoes/utilizadores`, "page");
    return { success: true };
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    if (error.message === "FORBIDDEN")
      return { success: false, error: "Sem permissão." };
    if (error.message === "CANNOT_DELETE_SELF")
      return { success: false, error: "Não pode eliminar a sua própria conta." };
    if (error.message === "CANNOT_DELETE_ADMIN")
      return { success: false, error: "Não pode eliminar o administrador." };
    if (error.message === "CANNOT_DELETE_LAST_SUPER_ADMIN")
      return { success: false, error: "Não pode eliminar o único Super Admin do sistema." };
    if (error.message === "USER_NOT_FOUND")
      return { success: false, error: "Utilizador não encontrado." };
    console.error("[DELETE_USER_ERROR]:", error);
    return { success: false, error: "Erro ao eliminar utilizador." };
  }
}