import prisma from "@/lib/prisma";

const buildWhere = (filters: {
    churchName?: string;
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

export const AuditAdminService = {
    async filterLogs(filters: Parameters<typeof buildWhere>[0]) {
        const logs = await prisma.auditLog.findMany({
            where: buildWhere(filters),
            orderBy: { createdAt: "desc" },
            take: 51,
            select: logSelect,
        });

        const hasMore = logs.length > 50;
        const data = hasMore ? logs.slice(0, 50) : logs;

        return {
            data,
            nextCursor: hasMore ? data[data.length - 1].id : null,
            hasMore,
        };
    },

    async loadMore(cursor: string, filters: Parameters<typeof buildWhere>[0]) {
        const logs = await prisma.auditLog.findMany({
            where: buildWhere(filters),
            orderBy: { createdAt: "desc" },
            take: 51,
            cursor: { id: cursor },
            skip: 1,
            select: logSelect,
        });

        const hasMore = logs.length > 50;
        const data = hasMore ? logs.slice(0, 50) : logs;

        return {
            data,
            nextCursor: hasMore ? data[data.length - 1].id : null,
            hasMore,
        };
    },

    async exportLogs(filters: Parameters<typeof buildWhere>[0]) {
        const logs = await prisma.auditLog.findMany({
            where: buildWhere(filters),
            orderBy: { createdAt: "desc" },
            take: 5000,
            select: {
                createdAt: true,
                action: true,
                entityName: true,
                entityId: true,
                userEmail: true,
                church: { select: { name: true } },
            },
        });

        const header = "Data,Igreja,Utilizador,Acção,Entidade,ID Entidade";
        const rows = logs.map(log => [
            new Date(log.createdAt).toLocaleString("pt-AO"),
            log.church?.name ?? "",
            log.userEmail ?? "",
            log.action,
            log.entityName,
            log.entityId.substring(0, 8),
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")); // 👈

        return {
            csv: [header, ...rows].join("\n"),
            total: logs.length,
        };
    },
};