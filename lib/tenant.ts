// lib/tenant.ts
import { cache } from "react"; // 👈 adiciona
import prisma from "./prisma";

export const getChurchBySlug = cache(async (slug: string, churchId?: string) => { // 👈
  if (!churchId) return null;
  return await prisma.church.findUnique({
    where: { slug, id: churchId },
    select: { id: true, name: true, plan: true, slug: true },
  });
});