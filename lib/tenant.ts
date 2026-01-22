
import prisma from "./prisma"


export async function getChurchBySlug(slug: string) {
  // Como mentor, recomendo usar cache aqui no futuro
  return await prisma.church.findUnique({
    where: { slug },
    select: { id: true, name: true, plan: true }
  })
}