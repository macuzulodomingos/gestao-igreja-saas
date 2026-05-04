"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Shield, Loader2, Search, ChevronDown, ChevronUp, Download, ExternalLink } from "lucide-react";
import { loadMoreAuditLogsAction, filterAuditLogsAction, exportAuditLogsAction } from "@/app/actions/audit-admi-actions";
import { toast } from "sonner";
import { Prisma } from "@prisma/client";

type AuditLog = {
  id: string;
  churchId: string | null;
  userId: string | null;
  userEmail: string | null;
  action: string;
  entityName: string;
  entityId: string;
  oldData: unknown;
  newData: unknown;
  createdAt: Date;
  church: { name: string; slug: string } | null;
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  SOFT_DELETE: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  CONFIRM: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  REJECT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  SUBMIT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

const IGNORED_FIELDS = [
  "id", "churchId", "updatedAt", "createdAt",
  "roleId", "categoryId", "departmentId", "leaderId",
  "deletedAt", "userId", "ipAddress",
];

const getActionColor = (action: string) => {
  const key = Object.keys(ACTION_COLORS).find(k => action.includes(k));
  return key ? ACTION_COLORS[key] : "bg-muted text-muted-foreground";
};

const ENTITY_NAMES = [
  "Member", "Finance", "Event", "Department",
  "User", "Church", "Subscription", "FinanceCategory",
  "EventCategory", "MemberRole",
];

const getDiff = (oldData: unknown, newData: unknown) => {
  if (!oldData && !newData) return [];
  if (!oldData && newData && typeof newData === "object" && !Array.isArray(newData)) {
    return Object.entries(newData as Record<string, unknown>)
      .filter(([key]) => !IGNORED_FIELDS.includes(key))
      .map(([key, value]) => ({ key, old: null, new: value }));
  }
  if (
    oldData && newData &&
    typeof oldData === "object" && typeof newData === "object" &&
    !Array.isArray(oldData) && !Array.isArray(newData)
  ) {
    const allKeys = new Set([
      ...Object.keys(oldData as Record<string, unknown>),
      ...Object.keys(newData as Record<string, unknown>),
    ]);
    return Array.from(allKeys)
      .filter(key => !IGNORED_FIELDS.includes(key))
      .filter(key =>
        JSON.stringify((oldData as any)[key]) !== JSON.stringify((newData as any)[key])
      )
      .map(key => ({
        key,
        old: (oldData as any)[key],
        new: (newData as any)[key],
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

export function AuditoriaClient({ initialLogs }: { initialLogs: AuditLog[] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [cursor, setCursor] = useState<string | null>(initialLogs[initialLogs.length - 1]?.id ?? null);
  const [hasMore, setHasMore] = useState(initialLogs.length === 50);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    churchName: "",
    action: "",
    entityName: "",
    dateFrom: "",
    dateTo: "",
  });

  const handleFilter = async () => {
    setFiltering(true);
    const result = await filterAuditLogsAction({
      churchName: filters.churchName || undefined,
      action: filters.action || undefined,
      entityName: filters.entityName || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    });
    setFiltering(false);
    if (!result.success || !result.data) { toast.error("Erro ao filtrar."); return; }
    setLogs(result.data as AuditLog[]);
    setCursor(result.data[result.data.length - 1]?.id ?? null);
    setHasMore(result.hasMore ?? false);
  };

  const handleLoadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    const result = await loadMoreAuditLogsAction(cursor, {
      churchName: filters.churchName || undefined,
      action: filters.action || undefined,
      entityName: filters.entityName || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    });
    setLoadingMore(false);
    if (!result.success || !result.data) { toast.error("Erro ao carregar mais."); return; }
    setLogs(prev => [...prev, ...result.data as AuditLog[]]);
    setCursor(result.nextCursor ?? null);
    setHasMore(result.hasMore ?? false);
  };

  const handleReset = async () => {
    setFilters({ churchName: "", action: "", entityName: "", dateFrom: "", dateTo: "" });
    setFiltering(true);
    const result = await filterAuditLogsAction({});
    setFiltering(false);
    if (!result.success || !result.data) return;
    setLogs(result.data as AuditLog[]);
    setCursor(result.data[result.data.length - 1]?.id ?? null);
    setHasMore(result.hasMore ?? false);
  };

  const handleExport = async () => {
    setExporting(true);
    const result = await exportAuditLogsAction({
      churchName: filters.churchName || undefined,
      action: filters.action || undefined,
      entityName: filters.entityName || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    });
    setExporting(false);
    if (!result.success || !result.csv) { toast.error("Erro ao exportar."); return; }

    // 👈 aviso se muitos registos
    if (result.total > 1000) {
      toast.warning(`Exportados ${result.total} registos. O ficheiro pode ser grande.`);
    }

    // 👈 download automático
    const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (result.total <= 1000) {
      toast.success("CSV exportado com sucesso!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Auditoria Global</h1>
            <p className="text-muted-foreground">Todas as acções realizadas no sistema.</p>
          </div>
        </div>
        <Button onClick={handleExport} disabled={exporting} variant="outline" className="gap-2">
          {exporting
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Download className="h-4 w-4" />
          }
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Nome da Igreja"
              value={filters.churchName}
              onChange={(e) => setFilters(prev => ({ ...prev, churchName: e.target.value }))}
              className="flex-1"
            />
            <Input
              placeholder="Acção (ex: CREATE_MEMBER)"
              value={filters.action}
              onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
              className="flex-1"
            />
            <Select
              value={filters.entityName || "all"}
              onValueChange={(val) => setFilters(prev => ({ ...prev, entityName: val === "all" ? "" : val }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Entidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {ENTITY_NAMES.map(e => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 👈 filtro por data */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1">
              <label className="text-sm text-muted-foreground whitespace-nowrap">De:</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <label className="text-sm text-muted-foreground whitespace-nowrap">Até:</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
            <Button onClick={handleFilter} disabled={filtering} className="gap-2">
              {filtering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Filtrar
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={filtering}>
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de logs */}
      <div className="space-y-2">
        {logs.length === 0 ? (
          <Card>
            <CardContent className="flex justify-center py-12">
              <p className="text-muted-foreground">Nenhum log encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          logs.map((log) => {
            const diff = getDiff(log.oldData, log.newData);
            const hasDiff = diff.length > 0;
            const isExpanded = expandedId === log.id;

            return (
              <Card key={log.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="py-3 px-4">
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${hasDiff ? "cursor-pointer" : ""}`}
                    onClick={() => hasDiff && setExpandedId(isExpanded ? null : log.id)}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className={`text-xs ${getActionColor(log.action)}`}>
                        {log.action}
                      </Badge>
                      <span className="text-sm font-medium">{log.entityName}</span>

                      {/* 👈 link para a igreja */}
                      {log.church && (
                        <span className="text-xs  text-primary">
                          — {log.church.name}
                        </span>
                      )}

                      {hasDiff && (
                        <span className="text-xs text-muted-foreground">
                          {diff.map(d => d.key).join(", ")}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {log.userEmail && <span>{log.userEmail}</span>}
                      <span>
                        {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                      {hasDiff && (
                        isExpanded
                          ? <ChevronUp className="h-4 w-4" />
                          : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>

                  {/* 👈 diff expandido */}
                  {isExpanded && hasDiff && (
                    <div className="mt-3 rounded-lg border bg-muted/30 overflow-hidden">
                      <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground bg-muted px-3 py-2">
                        <span>Campo</span>
                        <span>Antes</span>
                        <span>Depois</span>
                      </div>
                      {diff.map(({ key, old: oldVal, new: newVal }) => (
                        <div key={key} className="grid grid-cols-3 text-xs px-3 py-2 border-t">
                          <span className="font-medium">{key}</span>
                          <span className="text-red-600 truncate pr-2">{formatValue(oldVal)}</span>
                          <span className="text-green-600 truncate">{formatValue(newVal)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Carregar mais */}
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore} className="gap-2">
            {loadingMore
              ? <><Loader2 className="h-4 w-4 animate-spin" /> A carregar...</>
              : <><ChevronDown className="h-4 w-4" /> Carregar mais</>
            }
          </Button>
        </div>
      )}
    </div>
  );
}