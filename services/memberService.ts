import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type UpdateMemberDTO = {
  name?: string;
  email?: string | null;
  phone?: string | null;
  roleId?: string | null;
  joinDate?: Date | string;
  status?: "ATIVO" | "INATIVO" | "TRANSFERIDO" | "FALECIDO";
};

type CreateMemberDTO = {
  name: string;
  email?: string | null;
  phone?: string | null;
  roleId?: string | null;
  joinDate?: Date | string;
  status?: "ATIVO" | "INATIVO" | "TRANSFERIDO" | "FALECIDO";
};

interface Actor {
  userId: string;
  email: string;
}

// 👈 tipo seguro em vez de any
const sanitizeForLog = (data: Record<string, unknown> | null) => {
  if (!data) return undefined; // 👈 undefined em vez de null
  const { churchId, updatedAt, createdAt, ...importantData } = data;
  return importantData as Prisma.InputJsonValue;  // 👈 cast aqui no helper
};

export const MemberService = {
  async getMembersByChurch(churchId: string, page = 1, limit = 10, search = "") {
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
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          joinDate: true,
          roleId: true,
          churchId: true,
          createdAt: true,
          updatedAt: true,
          role: { select: { id: true, name: true } }, // 👈 select em vez de include
        },
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

  async createMember(churchId: string, actor: Actor, data: CreateMemberDTO) {
    return prisma.$transaction(async (tx) => {
      const finalRoleId = data.roleId !== undefined ? data.roleId : null;

      const newMember = await tx.member.create({
        data: {
          name: data.name,
          email: data.email ?? undefined,
          phone: data.phone ?? undefined,
          roleId: finalRoleId ?? undefined,
          joinDate: data.joinDate ? new Date(data.joinDate) : new Date(),
          status: data.status ?? "ATIVO",
          churchId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          joinDate: true,
          roleId: true,
          churchId: true,
          createdAt: true,
          updatedAt: true,
          role: { select: { id: true, name: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "CREATE_MEMBER",
          entityName: "Member",
          entityId: newMember.id,
          newData: sanitizeForLog(newMember as Record<string, unknown>),
        },
      });

      return newMember;
    });
  },

  async updateMember(id: string, churchId: string, actor: Actor, data: UpdateMemberDTO) {
    const validJoinDate =
      data.joinDate && !isNaN(new Date(data.joinDate).getTime())
        ? new Date(data.joinDate)
        : undefined;

    // 👈 findUnique + verificação manual do churchId
    const currentMember = await prisma.member.findUnique({
      where: { id },
    });

    if (!currentMember) throw new Error("MEMBER_NOT_FOUND");
    if (currentMember.churchId !== churchId) throw new Error("MEMBER_NOT_FOUND");

    return prisma.$transaction(async (tx) => {
      const finalRoleId = data.roleId !== undefined ? data.roleId : null;

      // 👈 update em vez de updateMany
      const updatedMember = await tx.member.update({
        where: { id },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          roleId: finalRoleId,
          status: data.status,
          joinDate: validJoinDate,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          joinDate: true,
          roleId: true,
          churchId: true,
          createdAt: true,
          updatedAt: true,
          role: { select: { id: true, name: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId || null,
          userEmail: actor.email,
          action: "UPDATE_MEMBER",
          entityName: "Member",
          entityId: id,
          oldData: sanitizeForLog(currentMember as Record<string, unknown>),
          newData: sanitizeForLog(updatedMember as Record<string, unknown>),
        },
      });

      return updatedMember;
    });
  },

  async deleteMember(id: string, churchId: string, actor: Actor) {
    // 👈 findUnique + verificação manual do churchId
    const memberToDelete = await prisma.member.findUnique({
      where: { id },
    });

    if (!memberToDelete) throw new Error("MEMBER_NOT_FOUND");
    if (memberToDelete.churchId !== churchId) throw new Error("MEMBER_NOT_FOUND");

    return prisma.$transaction(async (tx) => {
      // 👈 delete em vez de deleteMany
      await tx.member.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
          userEmail: actor.email,
          action: "DELETE_MEMBER",
          entityName: "Member",
          entityId: id,
          oldData: sanitizeForLog(memberToDelete as Record<string, unknown>),
        },
      });
    });
  },

  async getMemberHistory(memberId: string, churchId?: string) {
    return prisma.auditLog.findMany({
      where: {
        entityId: memberId,
        entityName: "Member",
        ...(churchId && { churchId }),
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    });
  },
};