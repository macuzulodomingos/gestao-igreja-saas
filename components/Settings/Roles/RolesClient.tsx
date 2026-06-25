"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { deleteRoleAction } from "@/app/actions/member-role-actions";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MemberRole } from "@/types/role";
import { RolesList } from "./RolesList";
import { RoleFormDialog } from "./RoleFormDialog";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

interface Props {
  initialRoles: MemberRole[];
  churchId: string;
}

export default function RolesClient({ initialRoles, churchId }: Props) {
  const [roles, setRoles] = useState(initialRoles);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<MemberRole | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<MemberRole | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const t = useTranslations("roles");
  const router = useRouter();

  useEffect(() => {
    setRoles(initialRoles);
  }, [initialRoles]);

  const handleAdd = () => {
    setEditingRole(null);
    setIsFormOpen(true);
  };

  const handleEdit = (role: MemberRole) => {
    setEditingRole(role);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const role = roles.find(r => r.id === id);
    if (role) setRoleToDelete(role);
  };

  const confirmDelete = async () => {
    if (!roleToDelete || isDeleting) return;
    setIsDeleting(true);
    const targetId = roleToDelete.id;
    try {
      const result = await deleteRoleAction(targetId, churchId);
      if (result.success) {
        toast.success(t("successDeleted"));
        setRoles(prev => prev.filter(r => r.id !== targetId));
        router.refresh();
      } else {
        toast.error(result.errorCode ? t(`errors.${result.errorCode}`) : t("errorDelete"));
      }
    } catch {
      console.error("[DELETE_ROLE_ERROR]");
      toast.error(t("errorDelete"));
    } finally {
      setIsDeleting(false);
      setRoleToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("addRole")}
        </Button>
      </div>

      <RolesList
        roles={roles}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <RoleFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingRole(null);
        }}
        role={editingRole}
        churchId={churchId}
      />

      <AlertDialog
        open={!!roleToDelete}
        onOpenChange={(open) => !open && !isDeleting && setRoleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDeleteDesc")} <strong>{roleToDelete?.name}</strong>?{" "}
              {t("confirmDeleteDesc2")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}