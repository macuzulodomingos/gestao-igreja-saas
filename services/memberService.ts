import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type UpdateMemberDTO = {
  name?: string;
  email?: string | null;
  phone?: string | null;
  roleId?: string | null;
  joinDate?: Date;
  status?: "ATIVO" | "INATIVO" | "TRANSFERIDO" | "FALECIDO";
};

type CreateMemberDTO = {
  name: string;
  email?: string | null;
  phone?: string | null;
  roleId?: string | null;
  joinDate?: Date;
  status?: "ATIVO" | "INATIVO" | "TRANSFERIDO" | "FALECIDO";
};

interface Actor {
  userId: string;
  email: string;
}

// 👈 controle explícito dos campos — sem vazar dados internos
const sanitizeForLog = (data: Record<string, unknown> | null) => {
  if (!data) return undefined;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    status: data.status,
    joinDate: data.joinDate,
    roleId: data.roleId,
  } as Prisma.InputJsonValue;
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
          role: { select: { id: true, name: true } },
        },
        orderBy: { name: "asc" },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      prisma.member.count({ where: whereClause }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / safeLimit)); // 👈 mínimo 1 página

    return {
      members,
      metadata: {
        totalMembers: total,
        totalPages,
        currentPage: Math.min(safePage, totalPages),
      },
    };
  },

  async createMember(churchId: string, actor: Actor, data: CreateMemberDTO) {

    if (data.joinDate !== undefined && !(data.joinDate instanceof Date)) {
    throw new Error("INVALID_JOIN_DATE_TYPE");
  }

    return prisma.$transaction(async (tx) => {
      
      if (data.roleId != null) { // 👈 cobre null e undefined mas não string vazia
        const role = await tx.memberRole.findUnique({
          where: { id: data.roleId },
          select: { id: true, churchId: true },
        });
        if (!role || role.churchId !== churchId)
          throw new Error("INVALID_ROLE");
      }

      const newMember = await tx.member.create({
        data: {
          name: data.name,
          email: data.email ?? undefined,
          phone: data.phone ?? undefined,
          roleId: data.roleId ?? undefined,
          joinDate: data.joinDate ?? new Date(),
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

    // 1. Validação de Contrato (O "Segurança" do Service)
  if (data.joinDate !== undefined && !(data.joinDate instanceof Date)) {
    throw new Error("INVALID_JOIN_DATE_TYPE");
  }

    return prisma.$transaction(async (tx) => {
      // 👈 select explícito — sem overfetch
      const currentMember = await tx.member.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          joinDate: true,
          roleId: true,
          churchId: true,
        },
      });

      if (!currentMember || currentMember.churchId !== churchId)
        throw new Error("MEMBER_NOT_FOUND");

      // 👈 cobre null e undefined mas não string vazia
      if (data.roleId != null) {
        const role = await tx.memberRole.findUnique({
          where: { id: data.roleId },
          select: { churchId: true },
        });
        if (!role || role.churchId !== churchId)
          throw new Error("INVALID_ROLE");
      }

      const updatedMember = await tx.member.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.status !== undefined && { status: data.status }),
          // 👈 garante que joinDate é sempre Date
          ...(data.joinDate !== undefined && { joinDate: data.joinDate }),
          ...(data.roleId !== undefined && { roleId: data.roleId }),
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
        },
      });

      await tx.auditLog.create({
        data: {
          churchId,
          userId: actor.userId,
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
    const memberToDelete = await prisma.member.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        joinDate: true,
        roleId: true,
        churchId: true,
      },
    });

    if (!memberToDelete) throw new Error("MEMBER_NOT_FOUND");
    if (memberToDelete.churchId !== churchId) throw new Error("MEMBER_NOT_FOUND");

    return prisma.$transaction(async (tx) => {
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