"use client";

import { useTransition, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Shield, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { AuditLog } from "@/types/audit";
import { useTranslations, useLocale } from "next-intl";
import { Prisma } from "@prisma/client";

interface AuditoriaClientProps {
  initialLogs: AuditLog[];
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

// 👈 calcula diferenças entre oldData e newData
const getDiff = (oldData?: Prisma.JsonValue, newData?: Prisma.JsonValue) => {
  if (!oldData && !newData) return [];
  if (!oldData && newData && typeof newData === "object" && !Array.isArray(newData)) {
    return Object.entries(newData).map(([key, value]) => ({
      key,
      old: null,
      new: value,
    }));
  }
  if (oldData && !newData) return [];
  if (
    oldData && newData &&
    typeof oldData === "object" && typeof newData === "object" &&
    !Array.isArray(oldData) && !Array.isArray(newData)
  ) {
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    return Array.from(allKeys)
      .filter(key => JSON.stringify((oldData as any)[key]) !== JSON.stringify((newData as any)[key]))
      .map(key => ({
        key,
        old: (oldData as any)[key],
        new: (newData as any)[key],
      }));
  }
  return [];
};

const formatValue = (value: any): string => {
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
    <div className="space-y-6">
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
                {(Object.keys(t.raw("entities")) as string[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`entities.${key}` as any)}
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
                let entityLabel = log.entityName;
                try { entityLabel = t(`entities.${log.entityName}` as any); } catch { }

                const diff = getDiff(log.oldData, log.newData);
                const isExpanded = expandedId === log.id;
                const hasDiff = diff.length > 0;

                return (
                  <div key={log.id} className="hover:bg-muted/30 transition-colors">
                    {/* 👈 linha principal */}
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
                        {/* 👈 remove o ID — mostra campos alterados como preview */}
                        {hasDiff && !isExpanded && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {t("changedFields")}: {diff.map(d => d.key).join(", ")}
                          </p>
                        )}
                        {!hasDiff && log.newData && typeof log.newData === "object" && !Array.isArray(log.newData) && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {Object.keys(log.newData as object)
                              .filter(k => !["id", "churchId", "createdAt", "updatedAt", "deletedAt", "roleId", "categoryId"].includes(k))
                              .slice(0, 3)
                              .join(", ")}
                          </p>
                        )}
                      </div>

                      <div className="flex items-start gap-2 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleDateString(locale === "fr" ? "fr-FR" : "pt-AO")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleTimeString(locale === "fr" ? "fr-FR" : "pt-AO", {
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        </div>
                        {hasDiff && (
                          <div className="text-muted-foreground mt-0.5">
                            {isExpanded
                              ? <ChevronUp className="h-4 w-4" />
                              : <ChevronDown className="h-4 w-4" />
                            }
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 👈 detalhe das alterações expandido */}
                    {isExpanded && hasDiff && (
                      <div className="px-4 pb-4 ml-[76px]">
                        <div className="rounded-lg border bg-muted/30 overflow-hidden">
                          <div className="grid grid-cols-3 gap-0 text-xs font-medium text-muted-foreground bg-muted px-3 py-2">
                            <span>{t("field")}</span>
                            <span>{t("oldValue")}</span>
                            <span>{t("newValue")}</span>
                          </div>
                          {diff.map(({ key, old: oldVal, new: newVal }) => (
                            <div key={key} className="grid grid-cols-3 gap-0 text-xs px-3 py-2 border-t">
                              <span className="font-medium text-foreground">{key}</span>
                              <span className="text-red-600 truncate pr-2">{formatValue(oldVal)}</span>
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