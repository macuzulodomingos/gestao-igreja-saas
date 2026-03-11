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

interface Props {
  initialCategories: FinanceCategory[];
}

export default function CategoriesClient({ initialCategories }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<FinanceCategory | null>(null);

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
    if (result.success) toast.success("Categoria eliminada!");
    else toast.error(result.error || "Erro ao eliminar.");
    setCategoryToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Categorias</h1>
          <p className="text-muted-foreground mt-1">
            Gere as categorias de receitas e despesas da sua igreja.
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Categoria
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
            <AlertDialogTitle>Tens a certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja eliminar a categoria <strong>{categoryToDelete?.name}</strong>?{" "}
              Só é possível eliminar categorias sem transacções associadas.
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