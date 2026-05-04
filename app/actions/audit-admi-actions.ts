"use server";

import { auth } from "@/lib/auth";
import { AuditAdminService } from "@/services/auditAdminService";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN")
    throw new Error("UNAUTHORIZED");
}

export async function filterAuditLogsAction(filters: {
  churchName?: string;
  action?: string;
  entityName?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  try {
    await requireSuperAdmin();
    const result = await AuditAdminService.filterLogs(filters);
    return { success: true, ...result };
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return { success: false, error: "Sem permissão." };
    console.error("[AUDIT_FILTER_ERROR]:", error); // 👈
    return { success: false, error: "Erro ao carregar logs." };
  }
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
  try {
    await requireSuperAdmin();
    const result = await AuditAdminService.loadMore(cursor, filters ?? {});
    return { success: true, ...result };
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return { success: false, error: "Sem permissão." };
    console.error("[AUDIT_LOADMORE_ERROR]:", error); // 👈
    return { success: false, error: "Erro ao ler logs." };
  }
}

export async function exportAuditLogsAction(filters: {
  churchName?: string;
  action?: string;
  entityName?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  try {
    await requireSuperAdmin();
    const result = await AuditAdminService.exportLogs(filters);
    return { success: true, ...result };
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return { success: false, error: "Sem permissão." };
    console.error("[AUDIT_EXPORT_ERROR]:", error); // 👈
    return { success: false, error: "Erro ao exportar logs." };
  }
}