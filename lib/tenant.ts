import prisma from "./prisma"

export async function getChurchBySlug(slug: string, churchId?: string) {
  // 🔒 Se churchId não for passado, bloqueia — nunca busca sem verificação
  if (!churchId) return null;

  return await prisma.church.findUnique({
    where: {
      slug,
      
      id: churchId, // 👈 sempre obrigatório
    },
    select: { id: true, name: true, plan: true, slug: true },
  });
}