"use client";
import { useState } from "react";
import { DepartmentsList } from "@/components/Departments/DepartmentsList";
import { DepartmentFormDialog } from "@/components/Departments/DepartmentFormDialog";
import { DepartmentMembersDialog } from "@/components/Departments/DepartmentMembersDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { departments as initialDepartments, Department } from "@/lib/mock-data";

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [selectedDepartmentForMembers, setSelectedDepartmentForMembers] = useState<Department | null>(null);

  const handleAddDepartment = () => {
    setEditingDepartment(null);
    setIsFormOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setIsFormOpen(true);
  };

  const handleDeleteDepartment = (departmentId: string) => {
    setDepartments(departments.filter((d) => d.id !== departmentId));
  };

  const handleSaveDepartment = (departmentData: Omit<Department, "id" | "memberIds">) => {
    if (editingDepartment) {
      setDepartments(
        departments.map((d) =>
          d.id === editingDepartment.id ? { ...d, ...departmentData } : d
        )
      );
    } else {
      const newDepartment: Department = {
        ...departmentData,
        id: `dept-${Date.now()}`,
        memberIds: [],
      };
      setDepartments([newDepartment, ...departments]);
    }
    setIsFormOpen(false);
    setEditingDepartment(null);
  };

  const handleManageMembers = (department: Department) => {
    setSelectedDepartmentForMembers(department);
    setIsMembersOpen(true);
  };

  const handleSaveMembers = (departmentId: string, memberIds: string[]) => {
    setDepartments(departments.map((d) => (d.id === departmentId ? { ...d, memberIds } : d)));
    setIsMembersOpen(false);
    setSelectedDepartmentForMembers(null);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Departamentos</h1>
            <p className="text-muted-foreground mt-1">Organizar ministérios e responsabilidades</p>
          </div>
          <Button onClick={handleAddDepartment} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Departamentos
          </Button>
        </div>

        <DepartmentsList
          departments={departments}
          onEdit={handleEditDepartment}
          onDelete={handleDeleteDepartment}
          onManageMembers={handleManageMembers}
        />

        <DepartmentFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          department={editingDepartment}
          onSave={handleSaveDepartment}
        />

        {selectedDepartmentForMembers && (
          <DepartmentMembersDialog
            open={isMembersOpen}
            onOpenChange={setIsMembersOpen}
            department={selectedDepartmentForMembers}
            onSave={handleSaveMembers}
          />
        )}
      </div>
    </>
  );
}
