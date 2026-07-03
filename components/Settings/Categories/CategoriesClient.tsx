"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { deleteCategoryAction } from "@/app/actions/finance-category-actions";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FinanceCategory } from "@/types/category";
import { CategoriesList } from "./CategoriesList";
import { CategoryFormDialog } from "./CategoryFormDialog";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

interface Props {
  initialCategories: FinanceCategory[];
  churchId: string;
}

export default function CategoriesClient({ initialCategories, churchId }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<FinanceCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const t = useTranslations("categories");
  const router = useRouter();

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const handleAdd = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleEdit = (category: FinanceCategory) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (cat) setCategoryToDelete(cat);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete || isDeleting) return;
    setIsDeleting(true);
    const targetId = categoryToDelete.id;
    try {
      const result = await deleteCategoryAction(targetId, churchId);
      if (result.success) {
        toast.success(t("successDeleted"));
        setCategories(prev => prev.filter(c => c.id !== targetId));
        router.refresh();
      } else {
        toast.error(result.errorCode ? t(`errors.${result.errorCode}`) : t("errorDelete"));
      }
    } catch (error) {
      console.error("[DELETE_CATEGORY_ERROR]:", error);
      toast.error(t("errorDelete"));
    } finally {
      setIsDeleting(false);
      setCategoryToDelete(null);
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
          {t("addCategory")}
        </Button>
      </div>

      <CategoriesList
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CategoryFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingCategory(null);
        }}
        category={editingCategory}
        churchId={churchId}
      />

      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && !isDeleting && setCategoryToDelete(null)}
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