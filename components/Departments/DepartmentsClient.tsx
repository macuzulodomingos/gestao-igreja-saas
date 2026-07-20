"use client";

import { useEffect, useState } from "react";
import { DepartmentsList } from "./DepartmentsList";
import { DepartmentFormDialog } from "./DepartmentFormDialog";
import { DepartmentMembersDialog } from "./DepartmentMembersDialog";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { deleteDepartmentAction } from "@/app/actions/department-actions";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Department } from "@/types/department";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

interface DepartmentsClientProps {
  initialDepartments: Department[];
  activeMembersCount: number;
  churchId: string;
}

export default function DepartmentsClient({ initialDepartments, activeMembersCount, churchId }: DepartmentsClientProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [departments, setDepartments] = useState(initialDepartments);
  const upgrade = useUpgradeModal();
  const t = useTranslations("departments");
  const td = useTranslations("departments.errors");

  const router = useRouter();

  useEffect(() => {
    setDepartments(initialDepartments);
  }, [initialDepartments]);

  const handleAdd = () => {
    setEditingDepartment(null);
    setIsFormOpen(true);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const dept = departments.find(d => d.id === id);
    if (dept) setDepartmentToDelete(dept);
  };

  const handleManageMembers = (department: Department) => {
    setSelectedDepartment(department);
    setIsMembersOpen(true);
  };

  const confirmDelete = async () => {
    if (!departmentToDelete || isDeleting) return;
    setIsDeleting(true);
    const targetId = departmentToDelete.id;
    try {
      const result = await deleteDepartmentAction(targetId, churchId);
      if (result.success) {
        toast.success(t("successDeleted"));
        setDepartments(prev => prev.filter(d => d.id !== targetId));
        router.refresh();
      } else {
        toast.error(result.errorCode ? td(result.errorCode) : t("errorDelete"));
      }
    } catch (error) {
      console.error("[DELETE_DEPARTMENT_ERROR]:", error);
      toast.error(t("errorDelete"));
    } finally {
      setIsDeleting(false);
      setDepartmentToDelete(null);
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
          {t("addDepartment")}
        </Button>
      </div>

      <DepartmentsList
        departments={departments}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onManageMembers={handleManageMembers}
      />

      <DepartmentFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingDepartment(null);
        }}
        department={editingDepartment}
        churchId={churchId}
        onUpgrade={(message) => upgrade.showUpgrade(message)}
      />

      {selectedDepartment && (
        <DepartmentMembersDialog
          open={isMembersOpen}
          onOpenChange={(open) => {
            setIsMembersOpen(open);
            if (!open) setSelectedDepartment(null);
          }}
          department={selectedDepartment}
          totalActiveMembers={activeMembersCount}
          churchId={churchId}
        />
      )}

      <AlertDialog
        open={!!departmentToDelete}
        onOpenChange={(open) => !open && !isDeleting && setDepartmentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDeleteDesc")}{" "}
              <strong>{departmentToDelete?.name}</strong>?{" "}
              {t("irreversible")}
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

      <UpgradeModal
        open={upgrade.isOpen}
        onOpenChange={upgrade.onOpenChange}
        limitMessage={upgrade.message}
      />
    </div>
  );
}