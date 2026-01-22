import prisma from "@/lib/prisma"

export async function getChurchMembers(churchId: string) {
  // 🛡️ Regra de Ouro: O filtro churchId é OBRIGATÓRIO
  return await prisma.member.findMany({
    where: {
      churchId: churchId
    },
    orderBy: { name: 'asc' }
  })
}

export async function getMembersByChurch(churchId: string) {
  return await prisma.member.findMany({
    where: { churchId },
    include: {
      departments: true // Para substituir o 'departmentIds' do mock
    },
    orderBy: { name: 'asc' }
  });
}





  