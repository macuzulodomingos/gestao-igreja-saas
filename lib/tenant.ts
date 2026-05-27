// lib/tenant.ts — remove o cache
import prisma from "./prisma";

export async function getChurchBySlug(slug: string, churchId?: string | null) {
  if (!churchId) {
    return await prisma.church.findUnique({
      where: { slug },
      select: { id: true, name: true, plan: true, slug: true },
    });
  }
  return await prisma.church.findUnique({
    where: { slug, id: churchId },
    select: { id: true, name: true, plan: true, slug: true },
  });
}