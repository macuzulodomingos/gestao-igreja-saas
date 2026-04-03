"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { deleteCategoryAction } from "@/app/actions/finance-category-actions";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FinanceCategory } from "@/types/category";
import { CategoriesList } from "./CategoriesList";
import { CategoryFormDialog } from "./CategoryFormDialog";
import { useTranslations } from "next-intl";

interface Props {
  initialCategories: FinanceCategory[];
}

export default function CategoriesClient({ initialCategories }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<FinanceCategory | null>(null);
  const t = useTranslations("categories");

  const handleAdd = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleEdit = (category: FinanceCategory) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const cat = initialCategories.find(c => c.id === id);
    if (cat) setCategoryToDelete(cat);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    const result = await deleteCategoryAction(categoryToDelete.id);
    if (result.success) {
      toast.success(t("successDeleted"));
    } else {
      // 👈 traduz o errorCode
      const errorCode = (result as any).errorCode;
      toast.error(errorCode ? t(`errors.${errorCode}`) : t("errorDelete"));
    }
    setCategoryToDelete(null);
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
          {t("addCategory")}
        </Button>
      </div>

      <CategoriesList
        categories={initialCategories}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CategoryFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        category={editingCategory}
      />

      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDeleteDesc")} <strong>{categoryToDelete?.name}</strong>?{" "}
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