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

interface Props {
  initialRoles: MemberRole[];
}

export default function RolesClient({ initialRoles }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<MemberRole | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<MemberRole | null>(null);

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
    const result = await deleteRoleAction(roleToDelete.id);
    if (result.success) toast.success("Cargo eliminado!");
    else toast.error(result.error || "Erro ao eliminar.");
    setRoleToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Cargos</h1>
          <p className="text-muted-foreground mt-1">
            Gere os cargos dos membros da sua igreja.
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Cargo
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
      />

      <AlertDialog
        open={!!roleToDelete}
        onOpenChange={(open) => !open && setRoleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tens a certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja eliminar o cargo <strong>{roleToDelete?.name}</strong>?{" "}
              Só é possível eliminar cargos sem membros associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Confirmar Eliminação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}