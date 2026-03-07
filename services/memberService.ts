import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type UpdateMemberDTO = {
  name?: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null; // 👈 Mudamos para receber o TEXTO do input
  joinDate?: Date | string;
  status?: "ATIVO" | "INATIVO" | "TRANSFERIDO" | "FALECIDO"; // 👈 Use o Enum do Prisma
};

type CreateMemberDTO = {
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null; // 👈 Mudamos para receber o TEXTO do input
  joinDate?: Date | string;
  status?: "ATIVO" | "INATIVO" | "TRANSFERIDO" | "FALECIDO"; // 👈 Use o Enum do Prisma
};

interface Actor {
  userId: string;
  email: string;
}

// 👇 ADICIONA ESTE HELPER
const normalizeRoleName = (name: string) =>
  name.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());


// Helper para limpar dados sensíveis ou inúteis para o log
const sanitizeForLog = (data: any) => {
  if (!data) return null;
  // Usamos o "destructuring" para separar o que NÃO queremos
  const { churchId, updatedAt, createdAt, ...importantData } = data;
  return importantData;
};

export const MemberService = {
  // 1. Busca Paginada - Robusta e Segura
  async getMembersByChurch(
    churchId: string,
    page = 1,
    limit = 10,
    search = "",
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const searchTerm = search.trim();
    const isSearchValid = searchTerm.length >= 2;

    const whereClause = {
      churchId,
      ...(isSearchValid && {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" as const } },
          { email: { contains: searchTerm, mode: "insensitive" as const } },
          { role: { name: { contains: searchTerm, mode: "insensitive" as const } } },
        ],
      }),
    };

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where: whereClause,
        include: { role: true }, // 👈 Traz o nome do cargo (ex: "Pastor")
        orderBy: { name: "asc" },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      prisma.member.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / safeLimit);

    return {
      members,
      metadata: {
        totalMembers: total,
        totalPages,
        currentPage: Math.min(safePage, totalPages || 1),
      },
    };
  },

  // 2. Criar membro + Auditoria (Mapeamento explícito para segurança)
 async createMember(churchId: string, actor: Actor, data: CreateMemberDTO) {
    return await prisma.$transaction(async (tx) => {
      let finalRoleId = null;

      // Se o utilizador escreveu algo no campo "Função"
      if (data.role && data.role.trim() !== "") {
        const roleName = normalizeRoleName(data.role); // 👈 normaliza aqui

        // 🛡️ Verifica se existe ou cria o cargo na hora para esta igreja
        const roleRecord = await tx.memberRole.upsert({
          where: {
            churchId_name: { churchId, name: roleName },
          },
          update: {},
          create: { name: roleName, churchId },
        });
        finalRoleId = roleRecord.id;
      }
      const newMember = await tx.member.create({
        data: {
          name: data.name,
          email: data.email ?? undefined,
          phone: data.phone ?? undefined,
          roleId: finalRoleId ?? undefined, // 👈 Agora usamos o ID gerado
          joinDate: data.joinDate ? new Date(data.joinDate) : new Date(),
          status: data.status ?? "ATIVO",
          churchId, // 🔒 Injetado via servidor
        },
        include: { role: true }
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "CREATE_MEMBER",
          entityName: "Member",
          entityId: newMember.id,
          newData: newMember as unknown as Prisma.InputJsonValue,
        },
      });

      return newMember;
    });
  },

  // 3. Atualizar membro + Auditoria (Isolamento total SaaS)
  async updateMember(
    id: string,
    churchId: string,
    actor: Actor,
    data: UpdateMemberDTO,
  ) {
    const validJoinDate =
      data.joinDate && !isNaN(new Date(data.joinDate).getTime())
        ? new Date(data.joinDate)
        : undefined;
    const currentMember = await prisma.member.findFirst({
      where: { id, churchId },
    });

    if (!currentMember) throw new Error("MEMBER_NOT_FOUND_OR_ACCESS_DENIED");

    return await prisma.$transaction(async (tx) => {
      let finalRoleId = null;

      // 🛡️ Lógica de Upsert para o Cargo
      if (data.role && data.role.trim() !== "") {
        const roleName = normalizeRoleName(data.role); // 👈 normaliza aqui
        const roleRecord = await tx.memberRole.upsert({
          where: {
            churchId_name: { churchId, name: roleName },
          },
          update: {},
          create: { name: roleName, churchId },
        });
        finalRoleId = roleRecord.id;
      }

      // 🛡️ updateMany com churchId é a sua garantia multi-tenant
      await tx.member.updateMany({
        where: { id, churchId },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          // 🛡️ A SOLUÇÃO: Se o roleId for uma string vazia ou inválida, enviamos null
          roleId: finalRoleId, // 👈 Salva o ID (seja novo ou existente)
          status: data.status,
          joinDate: validJoinDate,
        },
      });

      const updatedMember = await tx.member.findUnique({ where: { id }, include: { role: true } });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId || null,
          userEmail: actor.email,
          action: "UPDATE_MEMBER",
          entityName: "Member",
          entityId: id,
          oldData: sanitizeForLog(
            currentMember,
          ) as unknown as Prisma.InputJsonValue,
          newData: sanitizeForLog(
            updatedMember,
          ) as unknown as Prisma.InputJsonValue,
        },
      });

      return updatedMember;
    });
  },

  // 4. Excluir membro + Auditoria
  async deleteMember(id: string, churchId: string, actor: Actor) {
    const memberToDelete = await prisma.member.findFirst({
      where: { id, churchId },
    });

    if (!memberToDelete) throw new Error("MEMBER_NOT_FOUND_OR_ACCESS_DENIED");

    return await prisma.$transaction(async (tx) => {
      const result = await tx.member.deleteMany({
        where: { id, churchId },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "DELETE_MEMBER",
          entityName: "Member",
          entityId: id,
          oldData: memberToDelete as unknown as Prisma.InputJsonValue,
        },
      });

      return result;
    });
  },

  // NOVA FUNÇÃO: Buscar histórico de um membro específico
  async getMemberHistory(memberId: string, churchId?: string) {
    return await prisma.auditLog.findMany({
      where: {
        entityId: memberId,
        entityName: "Member",
        // Se o churchId for passado (usuário comum), filtra.
        // Se for undefined (SuperAdmin), ignora o filtro de igreja.
        ...(churchId && { churchId }),
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    });
  },
};
