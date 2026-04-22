"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const buildWhere = (filters: {
  churchName?: string;  // 👈 substitui churchId
  action?: string;
  entityName?: string;
  dateFrom?: string;
  dateTo?: string;
}) => ({
  ...(filters.churchName && {
    church: { name: { contains: filters.churchName, mode: "insensitive" as const } }
  }),
  ...(filters.action && { action: { contains: filters.action, mode: "insensitive" as const } }),
  ...(filters.entityName && { entityName: filters.entityName }),
  ...((filters.dateFrom || filters.dateTo) && {
    createdAt: {
      ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
      ...(filters.dateTo && { lte: new Date(`${filters.dateTo}T23:59:59`) }),
    },
  }),
});

const logSelect = {
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
};

export async function filterAuditLogsAction(filters: {
  churchName?: string;
  action?: string;
  entityName?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN")
    return { success: false, error: "Sem permissão." };

  const logs = await prisma.auditLog.findMany({
    where: buildWhere(filters),
    orderBy: { createdAt: "desc" },
    take: 51,
    select: logSelect,
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

export async function loadMoreAuditLogsAction(
  cursor: string,
  filters?: {
    churchName?: string;
    action?: string;
    entityName?: string;
    dateFrom?: string;
    dateTo?: string;
  }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN")
    return { success: false, error: "Sem permissão." };

  const logs = await prisma.auditLog.findMany({
    where: buildWhere(filters ?? {}),
    orderBy: { createdAt: "desc" },
    take: 51,
    cursor: { id: cursor },
    skip: 1,
    select: logSelect,
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

export async function exportAuditLogsAction(filters: {
  churchName?: string;
  action?: string;
  entityName?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN")
    return { success: false, error: "Sem permissão." };

  // 👈 sem limite para exportação
  const logs = await prisma.auditLog.findMany({
    where: buildWhere(filters),
    orderBy: { createdAt: "desc" },
    take: 5000,
    select: logSelect,
  });

  // 👈 gera CSV
  const header = "Data,Igreja,Utilizador,Acção,Entidade,ID Entidade";
  const rows = logs.map(log => [
    new Date(log.createdAt).toLocaleString("pt-AO"),
    log.church?.name ?? "",
    log.userEmail ?? "",
    log.action,
    log.entityName,
    log.entityId.substring(0, 8),
  ].map(v => `"${v}"`).join(","));

  const csv = [header, ...rows].join("\n");

  return { success: true, csv };
}