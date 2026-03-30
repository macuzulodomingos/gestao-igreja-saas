"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function updateLocaleAction(locale: "pt" | "fr") {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Não autenticado." };

  // 👈 guarda na DB
  await prisma.user.update({
    where: { id: session.user.id },
    data: { locale },
  });

  // 👈 guarda no cookie — o middleware consegue ler
  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 ano
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  return { success: true };
}