import { cache } from "react";
import prisma from "./prisma";

export const getChurchBySlug = cache(async (slug: string, churchId?: string | null) => {
  if (!churchId) {
    return await prisma.church.findUnique({
      where: { slug },
      select: { id: true, name: true, plan: true, slug: true, timezone: true }, // 👈 adiciona timezone
    });
  }
  return await prisma.church.findUnique({
    where: { slug, id: churchId },
    select: { id: true, name: true, plan: true, slug: true, timezone: true }, // 👈 adiciona timezone
  });
});