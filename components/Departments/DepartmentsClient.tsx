"use client";

import { useState } from "react";
import { DepartmentsList } from "./DepartmentsList";
import { DepartmentFormDialog } from "./DepartmentFormDialog";
import { DepartmentMembersDialog } from "./DepartmentMembersDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { deleteDepartmentAction } from "@/app/actions/department-actions";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Department, DepartmentListMember } from "@/types/department";

interface DepartmentsClientProps {
  initialDepartments: Department[];
  members: DepartmentListMember[];
}

export default function DepartmentsClient({ initialDepartments, members }: DepartmentsClientProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);

  const handleAdd = () => {
    setEditingDepartment(null);
    setIsFormOpen(true);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const dept = initialDepartments.find(d => d.id === id);
    if (dept) setDepartmentToDelete(dept);
  };

  const handleManageMembers = (department: Department) => {
    setSelectedDepartment(department);
    setIsMembersOpen(true);
  };

  const confirmDelete = async () => {
    if (!departmentToDelete) return;
    const result = await deleteDepartmentAction(departmentToDelete.id);
    if (result.success) toast.success("Departamento eliminado!");
    else toast.error(result.error || "Erro ao eliminar.");
    setDepartmentToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Departamentos</h1>
          <p className="text-muted-foreground mt-1">Organizar ministérios e responsabilidades</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Departamento
        </Button>
      </div>

      <DepartmentsList
        departments={initialDepartments}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onManageMembers={handleManageMembers}
      />

      <DepartmentFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        department={editingDepartment}
        members={members}
      />

      {selectedDepartment && (
        <DepartmentMembersDialog
          open={isMembersOpen}
          onOpenChange={setIsMembersOpen}
          department={selectedDepartment}
          allMembers={members}
        />
      )}

      <AlertDialog
        open={!!departmentToDelete}
        onOpenChange={(open) => !open && setDepartmentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tens a certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente eliminar o departamento{" "}
              <strong>{departmentToDelete?.name}</strong>?{" "}
              Esta acção é irreversível.
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