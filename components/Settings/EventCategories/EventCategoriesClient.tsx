"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { deleteEventCategoryAction } from "@/app/actions/event-category-actions";
import { EventCategoryFormDialog } from "./EventCategoryFormDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type EventCategory = {
  id: string;
  name: string;
  _count: { events: number };
};

interface EventCategoriesClientProps {
  initialCategories: EventCategory[];
}

export default function EventCategoriesClient({ initialCategories }: EventCategoriesClientProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EventCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<EventCategory | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!categoryToDelete) return;
    startTransition(async () => {
      const result = await deleteEventCategoryAction(categoryToDelete.id);
      if (result.success) {
        setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
        toast.success("Categoria eliminada.");
      } else {
        toast.error(result.error || "Erro ao eliminar.");
      }
      setCategoryToDelete(null);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-primary" />
            Categorias de Eventos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gere os tipos de eventos da sua igreja.
          </p>
        </div>
        <Button onClick={() => { setEditingCategory(null); setIsFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Categoria
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">
            {categories.length} categoria(s)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {categories.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">
              Nenhuma categoria criada.
            </p>
          ) : (
            <div className="divide-y">
              {categories.map(category => (
                <div key={category.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {category._count.events} evento(s)
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => { setEditingCategory(category); setIsFormOpen(true); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setCategoryToDelete(category)}
                      disabled={category._count.events > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EventCategoryFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingCategory={editingCategory}
        onSuccess={(updated) => {
          if (editingCategory) {
            setCategories(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
          } else {
            setCategories(prev => [...prev, { ...updated, _count: { events: 0 } }]);
          }
          setIsFormOpen(false);
        }}
      />

      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              A categoria <strong>{categoryToDelete?.name}</strong> será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}