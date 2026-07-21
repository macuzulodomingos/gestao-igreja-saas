"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Church, Users, Wallet,
  ChevronLeft, ChevronRight, Search, ExternalLink, ShieldAlert,
} from "lucide-react";
import { updateChurchPlanAction } from "@/app/actions/super-admin-actions";
import { startImpersonationAction } from "@/app/actions/impersonation-actions";
import { toast } from "sonner";


type ChurchSummary = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: Date;
  _count: { members: number; users: number; finances: number };
};

interface AdminClientProps {
  stats: {
    totalChurches: number;
    totalMembers: number;
    totalUsers: number;
    totalTransactions: number;
    planCounts: { FREE: number; PRO: number; ENTERPRISE: number };
  };
  initialChurches: ChurchSummary[];
  metadata: { total: number; totalPages: number; currentPage: number };
  filters: { search: string };
}

const planColors: Record<string, string> = {
  FREE: "bg-slate-100 text-slate-600",
  PRO: "bg-blue-100 text-blue-700",
  ENTERPRISE: "bg-amber-100 text-amber-700",
};

export default function AdminClient({
  stats,
  initialChurches,
  metadata,
  filters,
}: AdminClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.search);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [impersonationModal, setImpersonationModal] = useState<{
    churchId: string;
    churchSlug: string;
    churchName: string;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", "1");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    params.set("page", String(page));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const handlePlanChange = async (churchId: string, plan: "FREE" | "PRO" | "ENTERPRISE") => {
    setUpdatingId(churchId);
    try {
      const result = await updateChurchPlanAction(churchId, plan);
      if (result.success) {
        toast.success("Plano actualizado.");
        router.refresh();
      } else {
        toast.error("Erro ao actualizar plano.");
      }
    } catch (error) {
      console.error("[UPDATE_CHURCH_PLAN_ERROR]:", error);
      toast.error("Erro ao actualizar plano.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStartImpersonation = async () => {
    if (!impersonationModal || reason.trim().length < 10) {
      toast.error("O motivo deve ter pelo menos 10 caracteres.");
      return;
    }
    setIsStarting(true);
    try {
      const formData = new FormData();
      formData.append("reason", reason);

      const result = await startImpersonationAction(
        impersonationModal.churchId,
        impersonationModal.churchSlug,
        formData
      );

      // se chegou aqui é porque houve erro — em caso de sucesso a action
      // redireciona no servidor e nunca retorna pra este código
      if (result && !result.success) {
        toast.error("Erro ao iniciar sessão de suporte.");
      }
    } catch (error) {
      console.error("[START_IMPERSONATION_ERROR]:", error);
      toast.error("Erro ao iniciar sessão de suporte.");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Painel Global</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral de todas as igrejas no ChurchOS.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total de Igrejas", value: stats.totalChurches, icon: Church, color: "text-primary" },
          { label: "Total de Membros", value: stats.totalMembers, icon: Users, color: "text-blue-600" },
          { label: "Utilizadores", value: stats.totalUsers, icon: Users, color: "text-emerald-600" },
          { label: "Transacções", value: stats.totalTransactions, icon: Wallet, color: "text-amber-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${stat.color}`}>
                {stat.value.toLocaleString("pt-AO")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Planos */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { plan: "FREE", count: stats.planCounts.FREE },
          { plan: "PRO", count: stats.planCounts.PRO },
          { plan: "ENTERPRISE", count: stats.planCounts.ENTERPRISE },
        ].map((p) => (
          <Card key={p.plan}>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{p.count}</p>
              <p className="text-sm text-muted-foreground mt-1">Plano {p.plan}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista de Igrejas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Igrejas ({metadata.total})</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar igreja..."
              className="w-60"
            />
            <Button type="submit" variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <Card>
          <CardContent className="p-0">
            {initialChurches.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">
                Nenhuma igreja encontrada.
              </p>
            ) : (
              <div className="divide-y">
                {initialChurches.map((church) => (
                  <div key={church.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Church className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{church.name}</p>
                          <Link
                            href={`/${church.slug}/painel`}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {church.slug} · {church._count.members} membros · {church._count.users} utilizadores
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* 👈 botão de impersonation */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                        onClick={() => {
                          setReason("");
                          setImpersonationModal({
                            churchId: church.id,
                            churchSlug: church.slug,
                            churchName: church.name,
                          });
                        }}
                      >
                        <ShieldAlert className="h-3 w-3" />
                        Suporte
                      </Button>

                      <select
                        value={church.plan}
                        disabled={updatingId === church.id}
                        onChange={(e) => handlePlanChange(church.id, e.target.value as "FREE" | "PRO" | "ENTERPRISE")}
                        className={`text-xs rounded-full px-3 py-1 border-0 font-medium cursor-pointer ${planColors[church.plan]}`}
                      >
                        <option value="FREE">FREE</option>
                        <option value="PRO">PRO</option>
                        <option value="ENTERPRISE">ENTERPRISE</option>
                      </select>

                      <p className="text-xs text-muted-foreground hidden md:block">
                        {new Date(church.createdAt).toLocaleDateString("pt-AO")}
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

      {/* 👈 Modal de Impersonation */}
      <AlertDialog
        open={!!impersonationModal}
        onOpenChange={(open) => {
          if (!open) setImpersonationModal(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-yellow-600" />
              Aceder como {impersonationModal?.churchName}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta sessão dura <strong>1 hora</strong> e fica registada no audit log.
              Introduz o motivo do acesso de suporte.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Motivo do acesso <span className="text-destructive">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Cliente reportou erro no gráfico de finanças — ticket #1234"
              className="w-full rounded-md border px-3 py-2 text-sm min-h-[100px] resize-none focus:ring-2 focus:ring-primary outline-none"
              minLength={10}
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 10 caracteres — {reason.length}/500
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStartImpersonation}
              disabled={reason.trim().length < 10 || isStarting}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {isStarting ? "A iniciar..." : "Iniciar Sessão de Suporte"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}