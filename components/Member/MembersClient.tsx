"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  Loader2,
  UserPlus,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  createMemberAction,
  deleteMemberAction,
  updateMemberAction,
} from "@/app/actions/member-actions";
import { useDebounce } from "@/hooks/use-debounce";
import { MemberHistorySheet } from "@/components/Member/MemberHistorySheet";
import { Member, MemberRole } from "@/types/member";

const roleColors: Record<string, string> = {
  Pastor: "bg-primary/10 text-primary",
  Ancião: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Diácono: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  default: "bg-muted text-muted-foreground", // 👈 fallback para qualquer outro cargo
};

const statusColors: Record<string, string> = {
  ATIVO: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  INATIVO: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  TRANSFERIDO: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  FALECIDO: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

interface MemberClientProps {
  initialMembers: Member[];
  slug: string;
  metadata: {
    currentPage: number;
    totalPages: number;
    totalMembers: number;
  };
  roles: MemberRole[];

}


// Esta função extrai o dia, mês e ano "puros" (UTC)
const formatarDataSemFuso = (
  dataInput: string | Date,
  formato: "input" | "exibicao" = "exibicao",
) => {
  if (!dataInput) return "";
  const d = new Date(dataInput);

  const dia = String(d.getUTCDate()).padStart(2, "0");
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0"); // +1 porque janeiro é 0
  const ano = d.getUTCFullYear();

  // O <input type="date"> exige o formato AAAA-MM-DD
  if (formato === "input") return `${ano}-${mes}-${dia}`;

  // Na tabela queremos DD/MM/AAAA
  return `${dia}/${mes}/${ano}`;
};

export default function MemberClient({
  initialMembers,
  slug,
  metadata,
  roles,
}: MemberClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  // Estado para erros de validação do Zod
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Lógica de Busca
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    const currentQuery = searchParams.toString();
    const params = new URLSearchParams(currentQuery);

    if (debouncedSearch) {
      params.set("search", debouncedSearch);
      params.set("page", "1");
    } else {
      params.delete("search");
    }

    const newQuery = params.toString();

    // Se a URL pretendida for igual à atual, não faz nada
    if (newQuery === currentQuery) return;

    // Use replace para a busca não poluir o histórico do navegador
    router.replace(`/${slug}/membros?${newQuery}`);
  }, [debouncedSearch, searchParams, slug, router]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/${slug}/membros?${params.toString()}`);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    const formData = new FormData(event.currentTarget);

    // 1. Chamada de rede FORA do startTransition
    // (Aqui você usaria um setState manual de loading se não quiser o useTransition)
    let result;
    if (editingMember) {
      result = await updateMemberAction(editingMember.id, formData, slug);
    } else {
      result = await createMemberAction(formData);
    }

    // 2. Tratamento do resultado
    if (result.success) {
      // Transição de UI: O que acontece APÓS o sucesso
      startTransition(() => {
        setIsModalOpen(false);
        setEditingMember(null);
      });

      toast.success(
        editingMember ? "Membro atualizado!" : "Membro adicionado!",
      );
      (event.target as HTMLFormElement).reset();
    } else {
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
        toast.error("Verifique os erros no formulário.");
      } else {
        // Ajuste aqui: Mensagem dinâmica baseada no modo (Edição ou Criação)
        const fallbackError = editingMember
          ? "Erro ao atualizar os dados do membro."
          : "Erro ao realizar o cadastro do membro.";

        toast.error(result.error || fallbackError);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Membros</h1>
          <p className="text-muted-foreground">
            Listagem oficial de membros da /{slug}
          </p>
        </div>

        <Dialog
          open={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setEditingMember(null);
              setFieldErrors({});
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Novo Membro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingMember ? "Editar Membro" : "Cadastrar Membro"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              {/* Nome */}
              <div className="grid gap-2">
                <label
                  htmlFor="name"
                  className={`text-sm font-medium ${fieldErrors.name ? "text-destructive" : ""}`}
                >
                  Nome
                </label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingMember?.name || ""} // Adicione isso
                  placeholder="Nome completo"
                  className={fieldErrors.name ? "border-destructive" : ""}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-destructive">
                    {fieldErrors.name[0]}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Email */}
                <div className="grid gap-2">
                  <label
                    htmlFor="email"
                    className={`text-sm font-medium ${fieldErrors.email ? "text-destructive" : ""}`}
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    defaultValue={editingMember?.email || ""}
                    type="email"
                    placeholder="ex@email.com"
                    className={fieldErrors.email ? "border-destructive" : ""}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-destructive">
                      {fieldErrors.email[0]}
                    </p>
                  )}
                </div>
                {/* Telefone */}
                <div className="grid gap-2">
                  <label
                    htmlFor="phone"
                    className={`text-sm font-medium ${fieldErrors.phone ? "text-destructive" : ""}`}
                  >
                    Telefone
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={editingMember?.phone || ""}
                    placeholder="9xx xxx xxx"
                    className={fieldErrors.phone ? "border-destructive" : ""}
                  />
                  {fieldErrors.phone && (
                    <p className="text-xs text-destructive">
                      {fieldErrors.phone[0]}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Função */}
                <div className="grid gap-2">
                  <label
                    htmlFor="role"
                    className={`text-sm font-medium ${fieldErrors.role ? "text-destructive" : ""}`}
                  >
                    Cargo
                  </label>
                  <select
                    id="role"
                    name="role"
                    defaultValue={editingMember?.role?.id || ""}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Sem cargo</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.role && (
                    <p className="text-xs text-destructive">{fieldErrors.role[0]}</p>
                  )}
                </div>
                {/* Data */}
                <div className="grid gap-2">
                  <label
                    htmlFor="joinDate"
                    className={`text-sm font-medium ${fieldErrors.joinDate ? "text-destructive" : ""}`}
                  >
                    Ingresso
                  </label>
                  <Input
                    id="joinDate"
                    name="joinDate"
                    type="date"
                    className={fieldErrors.joinDate ? "border-destructive" : ""}
                    defaultValue={
                      editingMember?.joinDate
                        ? formatarDataSemFuso(editingMember.joinDate, "input")
                        : new Date().toISOString().split("T")[0]
                    }
                  />
                  {fieldErrors.joinDate && (
                    <p className="text-xs text-destructive">
                      {fieldErrors.joinDate[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* 👇 ADICIONA AQUI */}
              {editingMember && (
                <div className="grid gap-2">
                  <label htmlFor="status" className="text-sm font-medium">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={editingMember?.status || "ATIVO"}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                    <option value="TRANSFERIDO">Transferido</option>
                    <option value="FALECIDO">Falecido</option>
                  </select>
                </div>
              )}

              <DialogFooter className="mt-4">
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : editingMember ? (
                    "Salvar Alterações"
                  ) : (
                    "Confirmar Cadastro"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
          <CardTitle className="text-base font-medium">
            Total ({metadata.totalMembers})
          </CardTitle>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar no servidor..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead className="hidden md:table-cell">Contato</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead className="hidden lg:table-cell">Ingresso</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialMembers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Nenhum membro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                initialMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-[10px] bg-primary/5 text-primary">
                            {member.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span>{member.name}</span>
                          <span className="text-[10px] text-muted-foreground lg:hidden">
                            {format(new Date(member.joinDate), "dd/MM/yy")}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {member.email || "---"}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" /> {member.phone || "---"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={roleColors[member.role?.name || ""] || roleColors.default}
                        variant="secondary"
                      >
                        {member.role?.name || "Sem cargo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {formatarDataSemFuso(member.joinDate)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant="outline"
                        className={`font-medium ${statusColors[member.status] || statusColors.Inativo}`}
                      >
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                          {/* ADICIONE ISSO AQUI: */}
                          <DropdownMenuItem asChild>
                            <MemberHistorySheet
                              member={member}
                              trigger={
                                <div className="flex w-full cursor-pointer items-center">
                                  <span>Ver Histórico</span>
                                </div>
                              }
                            />
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingMember(member);
                              setIsModalOpen(true);
                            }}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={(e) => {
                              e.preventDefault(); // Impede o dropdown de fechar e "matar" o modal
                              setMemberToDelete(member);
                            }}
                          >
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <AlertDialog
            open={!!memberToDelete}
            onOpenChange={(open) => !open && setMemberToDelete(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Deseja realmente remover{" "}
                  <strong>{memberToDelete?.name}</strong>? Esta ação é
                  irreversível e removerá todos os dados deste membro.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={async () => {
                    if (!memberToDelete) return;

                    const result = await deleteMemberAction(memberToDelete.id);
                    if (result.success) {
                      toast.success("Membro removido com sucesso!");
                    } else {
                      toast.error(result.error);
                    }
                    setMemberToDelete(null);
                  }}
                >
                  Confirmar Exclusão
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Página {metadata.currentPage} de {metadata.totalPages}
            </p>
            <div className="flex items-center gap-2">
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
                disabled={
                  metadata.currentPage >= metadata.totalPages || isPending
                }
              >
                Próximo <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
