// lib/tenant.ts
import { cache } from "react"; // 👈 adiciona
import prisma from "./prisma";

// lib/tenant.ts
export const getChurchBySlug = cache(async (slug: string, churchId?: string | null) => {
  if (!churchId) {
    // 👈 SUPER_ADMIN — busca só pelo slug
    return await prisma.church.findUnique({
      where: { slug },
      select: { id: true, name: true, plan: true, slug: true },
    });
  }
  // utilizador normal — valida slug + churchId
  return await prisma.church.findUnique({
    where: { slug, id: churchId },
    select: { id: true, name: true, plan: true, slug: true },
  });
});