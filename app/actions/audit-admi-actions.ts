"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function loadMoreAuditLogsAction(
  cursor: string,
  filters?: {
    churchId?: string;
    action?: string;
    entityName?: string;
  }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN")
    return { success: false, error: "Sem permissão." };

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(filters?.churchId && { churchId: filters.churchId }),
      ...(filters?.action && { action: { contains: filters.action, mode: "insensitive" as const } }),
      ...(filters?.entityName && { entityName: filters.entityName }),
    },
    orderBy: { createdAt: "desc" },
    take: 51,
    cursor: { id: cursor },
    skip: 1,
    select: {
      id: true,
      churchId: true,
      userId: true,
      userEmail: true,
      action: true,
      entityName: true,
      entityId: true,
      oldData: true,
      newData: true,
      createdAt: true,
      church: { select: { name: true, slug: true } },
    },
  });

  const hasMore = logs.length > 50;
  const data = hasMore ? logs.slice(0, 50) : logs;

  return {
    success: true,
    data,
    nextCursor: hasMore ? data[data.length - 1].id : null,
    hasMore,
  };
}

export async function filterAuditLogsAction(filters: {
  churchId?: string;
  action?: string;
  entityName?: string;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN")
    return { success: false, error: "Sem permissão." };

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(filters.churchId && { churchId: filters.churchId }),
      ...(filters.action && { action: { contains: filters.action, mode: "insensitive" as const } }),
      ...(filters.entityName && { entityName: filters.entityName }),
    },
    orderBy: { createdAt: "desc" },
    take: 51,
    select: {
      id: true,
      churchId: true,
      userId: true,
      userEmail: true,
      action: true,
      entityName: true,
      entityId: true,
      oldData: true,
      newData: true,
      createdAt: true,
      church: { select: { name: true, slug: true } },
    },
  });

  const hasMore = logs.length > 50;
  const data = hasMore ? logs.slice(0, 50) : logs;

  return {
    success: true,
    data,
    nextCursor: hasMore ? data[data.length - 1].id : null,
    hasMore,
  };
}