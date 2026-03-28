"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Shield, Loader2, Search, ChevronDown } from "lucide-react";
import { loadMoreAuditLogsAction, filterAuditLogsAction } from "@/app/actions/audit-admi-actions";
import { toast } from "sonner";

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

const getActionColor = (action: string) => {
  const key = Object.keys(ACTION_COLORS).find(k => action.includes(k));
  return key ? ACTION_COLORS[key] : "bg-muted text-muted-foreground";
};

const ENTITY_NAMES = [
  "Member", "Finance", "Event", "Department",
  "User", "Church", "Subscription", "FinanceCategory",
  "EventCategory", "MemberRole",
];

export function AuditoriaClient({ initialLogs }: { initialLogs: AuditLog[] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [cursor, setCursor] = useState<string | null>(initialLogs[initialLogs.length - 1]?.id ?? null);
  const [hasMore, setHasMore] = useState(initialLogs.length === 50);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filtering, setFiltering] = useState(false);

  const [filters, setFilters] = useState({
    churchId: "",
    action: "",
    entityName: "",
  });

  const handleFilter = async () => {
    setFiltering(true);
    const result = await filterAuditLogsAction({
      churchId: filters.churchId || undefined,
      action: filters.action || undefined,
      entityName: filters.entityName || undefined,
    });
    setFiltering(false);

    if (!result.success || !result.data) {
      toast.error("Erro ao filtrar.");
      return;
    }

    setLogs(result.data as AuditLog[]);
    setCursor(result.data[result.data.length - 1]?.id ?? null);
    setHasMore(result.hasMore ?? false);
  };

  const handleLoadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    const result = await loadMoreAuditLogsAction(cursor, {
      churchId: filters.churchId || undefined,
      action: filters.action || undefined,
      entityName: filters.entityName || undefined,
    });
    setLoadingMore(false);

    if (!result.success || !result.data) {
      toast.error("Erro ao carregar mais.");
      return;
    }

    setLogs(prev => [...prev, ...result.data as AuditLog[]]);
    setCursor(result.nextCursor ?? null);
    setHasMore(result.hasMore ?? false);
  };

  const handleReset = async () => {
    setFilters({ churchId: "", action: "", entityName: "" });
    setFiltering(true);
    const result = await filterAuditLogsAction({});
    setFiltering(false);

    if (!result.success || !result.data) return;
    setLogs(result.data as AuditLog[]);
    setCursor(result.data[result.data.length - 1]?.id ?? null);
    setHasMore(result.hasMore ?? false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auditoria Global</h1>
          <p className="text-muted-foreground">
            Todas as acções realizadas no sistema.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="ID da Igreja"
              value={filters.churchId}
              onChange={(e) => setFilters(prev => ({ ...prev, churchId: e.target.value }))}
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
            <Button onClick={handleFilter} disabled={filtering} className="gap-2">
              {filtering
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Search className="h-4 w-4" />
              }
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
          logs.map((log) => (
            <Card key={log.id} className="hover:bg-muted/30 transition-colors">
              <CardContent className="py-3 px-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className={`text-xs ${getActionColor(log.action)}`}>
                      {log.action}
                    </Badge>
                    <span className="text-sm font-medium">{log.entityName}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {log.entityId.substring(0, 8)}...
                    </span>
                    {log.church && (
                      <span className="text-xs text-muted-foreground">
                        — {log.church.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {log.userEmail && <span>{log.userEmail}</span>}
                    <span>
                      {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", { locale: pt })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Carregar mais */}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="gap-2"
          >
            {loadingMore ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> A carregar...</>
            ) : (
              <><ChevronDown className="h-4 w-4" /> Carregar mais</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}