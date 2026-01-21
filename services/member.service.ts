import { prisma } from "@/lib/prisma";

export const MemberService = {
  // Por que um objeto? Facilita a organização e o mock em testes futuros.
  async createMember(data: any, churchId: string) {
    // Aqui entra a regra de negócio sênior: 
    // Nunca confiamos apenas no ID que vem do front.
    return await prisma.member.create({
      data: {
        ...data,
        churchId: churchId, // Forçamos o vínculo com a igreja logada
      },
    });
  },

  async getAllByChurch(churchId: string) {
    return await prisma.member.findMany({
      where: { churchId },
      orderBy: { name: 'asc' }
    });
  }
};