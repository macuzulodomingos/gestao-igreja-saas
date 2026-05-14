"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, MoreHorizontal, Mail, Phone, Loader2,
  UserPlus, Calendar, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl"; // 👈 NOVO
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  createMemberAction, deleteMemberAction, updateMemberAction,
} from "@/app/actions/member-actions";
import { useDebounce } from "@/hooks/use-debounce";
import { MemberHistorySheet } from "@/components/Member/MemberHistorySheet";
import { Member, MemberRole } from "@/types/member";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";

const roleColors: Record<string, string> = {
  Pastor: "bg-primary/10 text-primary",
  Ancião: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Diácono: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  default: "bg-muted text-muted-foreground",
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

const formatarDataSemFuso = (
  dataInput: string | Date,
  formato: "input" | "exibicao" = "exibicao",
) => {
  if (!dataInput) return "";
  const d = new Date(dataInput);
  const dia = String(d.getUTCDate()).padStart(2, "0");
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  const ano = d.getUTCFullYear();
  if (formato === "input") return `${ano}-${mes}-${dia}`;
  return `${dia}/${mes}/${ano}`;
};

export default function MemberClient({
  initialMembers, slug, metadata, roles,
}: MemberClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const upgrade = useUpgradeModal();
  const t = useTranslations("members"); // 👈 NOVO
  const tc = useTranslations("common"); // 👈 NOVO
  const tm = useTranslations("members.errors");
  const tv = useTranslations("validation");

  const translateError = (msg: string) => {
    try {
      const key = msg.startsWith("validation.")
        ? msg.replace("validation.", "")
        : msg;
      // 👈 Record com fallback em vez de as any
      const validKeys: Record<string, string> = {
        nameRequired: tv("nameRequired"),
        nameTooLong: tv("nameTooLong"),
        emailInvalid: tv("emailInvalid"),
        joinDateRequired: tv("joinDateRequired"),
        phoneFormat: tv("phoneFormat"),
        phoneTooShort: tv("phoneTooShort"),
        phoneTooLong: tv("phoneTooLong"),
      };
      return validKeys[key] ?? msg;
    } catch {
      return msg;
    }
  };

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
    if (newQuery === currentQuery) return;
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

    let result;
    if (editingMember) {
      result = await updateMemberAction(editingMember.id, formData, slug);
    } else {
      result = await createMemberAction(formData);
    }

    if (result.success) {
      startTransition(() => {
        setIsModalOpen(false);
        setEditingMember(null);
      });
      toast.success(editingMember ? t("successUpdated") : t("successCreated"));
      (event.target as HTMLFormElement).reset();
    } else if (!result.success && result.upgrade) {
      // 👈 TypeScript já sabe que errorCode existe
      upgrade.showUpgrade(result.errorCode ? tm(result.errorCode) : tc("upgrade"));
    } else if (!result.success && result.fieldErrors) {
      setFieldErrors(result.fieldErrors);
      toast.error(t("errorForm"));
    } else if (!result.success) {
      // 👈 TypeScript já sabe que errorCode existe
      toast.error(result.errorCode ? tm(result.errorCode) : tc("error"));
    }
  }

  



  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("subtitle")} /{slug}
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
              {t("newMember")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingMember ? t("editMember") : t("addMember")}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className={`text-sm font-medium ${fieldErrors.name ? "text-destructive" : ""}`}>
                  {t("fullName")}
                </label>
                <Input
                  id="name" name="name"
                  defaultValue={editingMember?.name || ""}
                  placeholder={t("fullName")}
                  className={fieldErrors.name ? "border-destructive" : ""}
                />
                {fieldErrors.name && <p className="text-xs text-destructive">{translateError(fieldErrors.name[0])}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="email" className={`text-sm font-medium ${fieldErrors.email ? "text-destructive" : ""}`}>
                    {t("email")}
                  </label>
                  <Input
                    id="email" name="email" type="email"
                    defaultValue={editingMember?.email || ""}
                    placeholder="ex@email.com"
                    className={fieldErrors.email ? "border-destructive" : ""}
                  />
                  {fieldErrors.email && <p className="text-xs text-destructive">{translateError(fieldErrors.email[0])}</p>}
                </div>
                <div className="grid gap-2">
                  <label htmlFor="phone" className={`text-sm font-medium ${fieldErrors.phone ? "text-destructive" : ""}`}>
                    {t("phone")}
                  </label>
                  <Input
                    id="phone" name="phone"
                    defaultValue={editingMember?.phone || ""}
                    placeholder="9xx xxx xxx"
                    className={fieldErrors.phone ? "border-destructive" : ""}
                  />
                  {fieldErrors.phone && <p className="text-xs text-destructive">{translateError(fieldErrors.phone[0])}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="role" className={`text-sm font-medium ${fieldErrors.role ? "text-destructive" : ""}`}>
                    {t("position")}
                  </label>
                  <select
                    id="role" name="role"
                    defaultValue={editingMember?.role?.id || ""}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">{t("noRole")}</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                  {fieldErrors.role && <p className="text-xs text-destructive">{translateError(fieldErrors.role[0])}</p>}
                </div>
                <div className="grid gap-2">
                  <label htmlFor="joinDate" className={`text-sm font-medium ${fieldErrors.joinDate ? "text-destructive" : ""}`}>
                    {t("admission")}
                  </label>
                  <Input
                    id="joinDate" name="joinDate" type="date"
                    className={fieldErrors.joinDate ? "border-destructive" : ""}
                    defaultValue={
                      editingMember?.joinDate
                        ? formatarDataSemFuso(editingMember.joinDate, "input")
                        : new Date().toISOString().split("T")[0]
                    }
                  />
                  {fieldErrors.joinDate && <p className="text-xs text-destructive">{translateError(fieldErrors.joinDate[0])}</p>}
                </div>
              </div>

              {editingMember && (
                <div className="grid gap-2">
                  <label htmlFor="status" className="text-sm font-medium">
                    {t("status")}
                  </label>
                  <select
                    id="status" name="status"
                    defaultValue={editingMember?.status || "ATIVO"}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="ATIVO">{t("active")}</option>
                    <option value="INATIVO">{t("inactive")}</option>
                    <option value="TRANSFERIDO">{t("transferred")}</option>
                    <option value="FALECIDO">{t("deceased")}</option>
                  </select>
                </div>
              )}

              <DialogFooter className="mt-4">
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : editingMember ? (
                    t("save")
                  ) : (
                    t("register")
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <UpgradeModal
        open={upgrade.isOpen}
        onOpenChange={upgrade.onOpenChange}
        limitMessage={upgrade.message}
      />

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
          <CardTitle className="text-base font-medium">
            {t("total")} ({metadata.totalMembers})
          </CardTitle>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("search")}
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
                <TableHead>{t("name")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("contact")}</TableHead>
                <TableHead>{t("role")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("joinDate")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("status")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    {t("noMembers")}
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
                            {formatarDataSemFuso(member.joinDate)}
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
                        {member.role?.name || t("noRole")}
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
                        className={`font-medium ${statusColors[member.status] || statusColors.INATIVO}`}
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
                          <DropdownMenuItem>{t("profile")}</DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <MemberHistorySheet
                              member={member}
                              trigger={
                                <div className="flex w-full cursor-pointer items-center">
                                  <span>{t("history")}</span>
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
                            {t("edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={(e) => {
                              e.preventDefault();
                              setMemberToDelete(member);
                            }}
                          >
                            {t("delete")}
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
                <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("confirmDeleteDesc")}{" "}
                  <strong>{memberToDelete?.name}</strong>?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  disabled={isPending}
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={async () => {
                    if (!memberToDelete) return;
                    const result = await deleteMemberAction(memberToDelete.id);
                    if (result.success) {
                      toast.success(t("successDeleted"));
                    } else {
                      toast.error(result.errorCode ? tm(result.errorCode) : tc("error"));
                    }
                    setMemberToDelete(null);
                  }}
                >
                  {isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : t("confirm")
                  }
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              {t("page")} {metadata.currentPage} {t("of")} {metadata.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm"
                onClick={() => handlePageChange(metadata.currentPage - 1)}
                disabled={metadata.currentPage <= 1 || isPending}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> {t("previous")}
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => handlePageChange(metadata.currentPage + 1)}
                disabled={metadata.currentPage >= metadata.totalPages || isPending}
              >
                {t("next")} <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}