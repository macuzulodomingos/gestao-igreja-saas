"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Shield, Filter } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entityName: string;
  entityId: string;
  userEmail: string | null;
  oldData: any;
  newData: any;
  createdAt: Date | string;
}

interface AuditoriaClientProps {
  initialLogs: AuditLog[];
  metadata: {
    total: number;
    totalPages: number;
    currentPage: number;
  };
  filters: {
    entityName: string;
    action: string;
  };
}

const ENTITY_LABELS: Record<string, string> = {
  Member: "Membros",
  Finance: "Finanças",
  Department: "Departamentos",
  Event: "Eventos",
  FinanceCategory: "Categorias",
  MemberRole: "Cargos",
};

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

export default function AuditoriaClient({
  initialLogs,
  metadata,
  filters,
}: AuditoriaClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const updateFilters = (newFilters: Record<string, string>) => {
    const params = new URLSearchParams();
    const merged = { ...filters, ...newFilters, page: "1" };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
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
          Auditoria
        </h1>
        <p className="text-muted-foreground mt-1">
          Registo completo de todas as acções realizadas no sistema.
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select
              value={filters.entityName || "all"}
              onValueChange={(val) =>
                updateFilters({ entityName: val === "all" ? "" : val })
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os módulos</SelectItem>
                {Object.entries(ENTITY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.action || "all"}
              onValueChange={(val) =>
                updateFilters({ action: val === "all" ? "" : val })
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Acção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as acções</SelectItem>
                <SelectItem value="CREATE">Criações</SelectItem>
                <SelectItem value="UPDATE">Edições</SelectItem>
                <SelectItem value="DELETE">Eliminações</SelectItem>
                <SelectItem value="SYNC">Sincronizações</SelectItem>
              </SelectContent>
            </Select>

            {(filters.entityName || filters.action) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilters({ entityName: "", action: "" })}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de logs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">
            {metadata.total} registo(s) encontrado(s)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {initialLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">
              Nenhum registo encontrado.
            </p>
          ) : (
            <div className="divide-y">
              {initialLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col items-center gap-1 shrink-0 w-20">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getActionColor(log.action)}`}>
                      {getActionLabel(log.action)}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {ENTITY_LABELS[log.entityName] || log.entityName}
                    </Badge>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {log.userEmail || "Sistema"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      ID: {log.entityId}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {metadata.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {metadata.currentPage} de {metadata.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(metadata.currentPage - 1)}
              disabled={metadata.currentPage <= 1 || isPending}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(metadata.currentPage + 1)}
              disabled={metadata.currentPage >= metadata.totalPages || isPending}
            >
              Próximo <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}