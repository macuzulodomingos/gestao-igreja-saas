"use client";

import { useTransition, useState } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Shield, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Prisma } from "@/app/generated/prisma/client";
import { ChurchLogsResult } from "@/services/auditService";
import { parseISO, isValid } from "date-fns";

interface DiffResult {
  key: string;
  old: Prisma.JsonValue | null;
  new: Prisma.JsonValue | null;
}

interface AuditoriaClientProps {
  initialLogs: ChurchLogsResult["logs"];
  metadata: {
    total: number;
    totalPages: number;
    currentPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    entityName: string;
    action: string;
  };
}

const actionColors: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  SYNC: "bg-amber-100 text-amber-700",
};

// Array estático das entidades auditáveis — alinhado com as chaves do JSON de tradução
const AUDITABLE_ENTITIES = [
  "Member", "Finance", "Department", "Event",
  "FinanceCategory", "MemberRole", "EventCategory",
  "User", "Subscription", "Church",
] as const;

type AuditableEntity = typeof AUDITABLE_ENTITIES[number];

const isAuditableEntity = (key: string): key is AuditableEntity =>
  AUDITABLE_ENTITIES.includes(key as AuditableEntity);

const getActionColor = (action: string) => {
  const key = Object.keys(actionColors).find(k => action.startsWith(k));
  return key ? actionColors[key] : "bg-muted text-muted-foreground";
};

const getActionLabel = (action: string) => {
  return action
    .replace("_MEMBER", "").replace("_EVENT", "")
    .replace("_DEPARTMENT", "").replace("_CATEGORY", "")
    .replace("_ROLE", "").replace("_INCOME", "")
    .replace("_EXPENSE", "").replace(/_/g, " ");
};

const IGNORED_FIELDS = [
  "id", "churchId", "updatedAt", "createdAt",
  "roleId", "categoryId", "departmentId", "leaderId",
  "deletedAt", "userId", "ipAddress",
];

const getDiff = (oldData?: Prisma.JsonValue, newData?: Prisma.JsonValue): DiffResult[] => {
  if (!oldData && !newData) return [];

  // CREATE: oldData nulo, newData com dados novos
  if (!oldData && newData && typeof newData === "object" && !Array.isArray(newData)) {
    return Object.entries(newData)
      .filter(([key]) => !IGNORED_FIELDS.includes(key))
      .map(([key, value]) => ({ key, old: null, new: value ?? null }));
  }

  // DELETE: oldData com dados, newData nulo — mostra o que foi removido
  if (oldData && !newData && typeof oldData === "object" && !Array.isArray(oldData)) {
    return Object.entries(oldData)
      .filter(([key]) => !IGNORED_FIELDS.includes(key))
      .map(([key, value]) => ({ key, old: value ?? null, new: null }));
  }

  // UPDATE: ambos preenchidos, calcula diferença real
  if (
    oldData && newData &&
    typeof oldData === "object" && typeof newData === "object" &&
    !Array.isArray(oldData) && !Array.isArray(newData)
  ) {
    const oldObj = oldData as Record<string, Prisma.JsonValue>;
    const newObj = newData as Record<string, Prisma.JsonValue>;

    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    return Array.from(allKeys)
      .filter(key => !IGNORED_FIELDS.includes(key))
      .filter(key => JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key]))
      .map(key => ({
        key,
        old: oldObj[key] ?? null,
        new: newObj[key] ?? null,
      }));
  }

  return [];
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "✓" : "✗";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export default function AuditoriaClient({
  initialLogs, metadata, filters,
}: AuditoriaClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const t = useTranslations("audit");
  const te = useTranslations("audit.entities"); // 👈 namespace específico para entidades
  const locale = useLocale();

  const updateFilters = (newFilters: Record<string, string>) => {
    const params = new URLSearchParams();
    const merged = { ...filters, ...newFilters, page: "1" };
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v); });
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();
    if (filters.entityName) params.set("entityName", filters.entityName);
    if (filters.action) params.set("action", filters.action);
    params.set("page", String(page));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  return (
    <div className={`space-y-6 transition-opacity duration-200 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t("filters")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select
              value={filters.entityName || "all"}
              onValueChange={(val) => updateFilters({ entityName: val === "all" ? "" : val })}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t("module")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allModules")}</SelectItem>
                {AUDITABLE_ENTITIES.map((key) => (
                  <SelectItem key={key} value={key}>
                    {te(key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.action || "all"}
              onValueChange={(val) => updateFilters({ action: val === "all" ? "" : val })}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t("action")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allActions")}</SelectItem>
                {(["CREATE", "UPDATE", "DELETE", "SYNC"] as const).map((action) => (
                  <SelectItem key={action} value={action}>
                    {t(`actions.${action}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filters.entityName || filters.action) && (
              <Button variant="ghost" size="sm" onClick={() => updateFilters({ entityName: "", action: "" })}>
                {t("clearFilters")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">
            {metadata.total} {t("records")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {initialLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">{t("empty")}</p>
          ) : (
            <div className="divide-y">
              {initialLogs.map((log) => {
                // Type guard garante que só chamamos te() com chaves válidas
                // Se a entidade não for conhecida, usa o nome cru da BD
                let entityLabel = log.entityName;
                if (isAuditableEntity(log.entityName)) {
                  entityLabel = te(log.entityName); 
                }

                const diff = getDiff(log.oldData, log.newData);
                const isExpanded = expandedId === log.id;
                const hasDiff = diff.length > 0;

                const createdAt = typeof log.createdAt === "string" ? parseISO(log.createdAt) : log.createdAt;
                const isValidDate = isValid(createdAt);

                return (
                  <div key={log.id} className="hover:bg-muted/30 transition-colors">
                    <div
                      className={`flex items-start gap-4 p-4 ${hasDiff ? "cursor-pointer" : ""}`}
                      onClick={() => hasDiff && setExpandedId(isExpanded ? null : log.id)}
                    >
                      <div className="flex flex-col items-center gap-1 shrink-0 min-w-[60px] max-w-[120px]">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getActionColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                        <Badge variant="outline" className="text-[10px] max-w-full truncate block text-center" title={entityLabel}>
                          {entityLabel}
                        </Badge>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {log.userEmail || t("system")}
                        </p>
                        {hasDiff && !isExpanded && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {t("changedFields")}: {diff.map(d => d.key).join(", ")}
                          </p>
                        )}
                        {!hasDiff && log.newData && typeof log.newData === "object" && !Array.isArray(log.newData) && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {Object.keys(log.newData as object)
                              .filter(k => !IGNORED_FIELDS.includes(k))
                              .slice(0, 3)
                              .join(", ")}
                          </p>
                        )}
                      </div>

                      <div className="flex items-start gap-2 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {isValidDate ? createdAt.toLocaleDateString(locale === "fr" ? "fr-FR" : "pt-AO") : "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isValidDate ? createdAt.toLocaleTimeString(locale === "fr" ? "fr-FR" : "pt-AO", {
                              hour: "2-digit", minute: "2-digit"
                            }) : "—"}
                          </p>
                        </div>
                        {hasDiff && (
                          <div className="text-muted-foreground mt-0.5">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        )}
                      </div>
                    </div>

                    {isExpanded && hasDiff && (
                      <div className="px-4 pb-4 ml-[76px]">
                        <div className="rounded-lg border bg-muted/30 overflow-hidden max-h-64 overflow-y-auto">
                          <div className="grid grid-cols-3 gap-0 text-xs font-medium text-muted-foreground bg-muted px-3 py-2 sticky top-0">
                            <span>{t("field")}</span>
                            <span>{t("oldValue")}</span>
                            <span>{t("newValue")}</span>
                          </div>
                          {diff.map(({ key, old: oldVal, new: newVal }) => (
                            <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-1 text-xs px-3 py-2 border-t">
                              <span className="font-medium text-foreground">{key}</span>
                              <span className="text-red-600 truncate">{formatValue(oldVal)}</span>
                              <span className="text-green-600 truncate">{formatValue(newVal)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {metadata.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("page")} {metadata.currentPage} {t("of")} {metadata.totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePageChange(metadata.currentPage - 1)} disabled={!metadata.hasPrev || isPending}>
              <ChevronLeft className="h-4 w-4 mr-1" /> {t("previous")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(metadata.currentPage + 1)} disabled={!metadata.hasNext || isPending}>
              {t("next")} <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}