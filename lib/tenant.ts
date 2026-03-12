import prisma from "./prisma"

export async function getChurchBySlug(slug: string, churchId?: string) {
  return await prisma.church.findUnique({
    where: {
      slug,
      // 🔒 Se churchId for passado, garante que o slug pertence à igreja da sessão
      ...(churchId && { id: churchId }),
    },
    select: { id: true, name: true, plan: true, slug: true },
  });
}