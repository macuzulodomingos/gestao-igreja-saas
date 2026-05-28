"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { deleteRoleAction } from "@/app/actions/member-role-actions";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MemberRole } from "@/types/role";
import { RolesList } from "./RolesList";
import { RoleFormDialog } from "./RoleFormDialog";
import { useTranslations } from "next-intl";

interface Props {
  initialRoles: MemberRole[];
  churchId: string;
}

export default function RolesClient({ initialRoles, churchId }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<MemberRole | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<MemberRole | null>(null);
  const t = useTranslations("roles");

  const handleAdd = () => {
    setEditingRole(null);
    setIsFormOpen(true);
  };

  const handleEdit = (role: MemberRole) => {
    setEditingRole(role);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const role = initialRoles.find(r => r.id === id);
    if (role) setRoleToDelete(role);
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;
    const result = await deleteRoleAction(roleToDelete.id, churchId);
    if (result.success) {
      toast.success(t("successDeleted"));
    } else {
      const errorCode = (result as any).errorCode;
      toast.error(errorCode ? t(`errors.${errorCode}`) : t("errorDelete"));
    }
    setRoleToDelete(null);
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
        roles={initialRoles}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <RoleFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        role={editingRole}
        churchId={churchId}
      />

      <AlertDialog
        open={!!roleToDelete}
        onOpenChange={(open) => !open && setRoleToDelete(null)}
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
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}