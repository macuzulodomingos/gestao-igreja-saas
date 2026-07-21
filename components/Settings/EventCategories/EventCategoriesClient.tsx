"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteEventCategoryAction } from "@/app/actions/event-category-actions";
import { EventCategoryFormDialog } from "./EventCategoryFormDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

type EventCategory = {
  id: string;
  name: string;
  _count: { events: number };
};

interface EventCategoriesClientProps {
  initialCategories: EventCategory[];
  churchId: string;
}

export default function EventCategoriesClient({ initialCategories, churchId }: EventCategoriesClientProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EventCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<EventCategory | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("eventCategories");
  const te = useTranslations("eventCategories.errors");
  const tc = useTranslations("common");
  const router = useRouter();

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const handleDelete = () => {
    if (!categoryToDelete || isPending) return;
    startTransition(async () => {
      try {
        const result = await deleteEventCategoryAction(categoryToDelete.id, churchId);
        if (result.success) {
          setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
          toast.success(t("successDeleted"));
          router.refresh();
        } else {
          toast.error(result.errorCode ? te(result.errorCode) : t("errorDelete"));
        }
      } catch (error) {
        console.error("[DELETE_EVENT_CATEGORY_ERROR]:", error);
        toast.error(t("errorDelete"));
      } finally {
        setCategoryToDelete(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-primary" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Button onClick={() => { setEditingCategory(null); setIsFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> {t("addCategory")}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">
            {categories.length} {t("count")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {categories.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">
              {t("empty")}
            </p>
          ) : (
            <div className="divide-y">
              {categories.map(category => (
                <div key={category.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{category.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {category._count.events} {t("events")}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      aria-label={t("form.editTitle")}
                      onClick={() => { setEditingCategory(category); setIsFormOpen(true); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      aria-label={t("confirm")}
                      onClick={() => setCategoryToDelete(category)}
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
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingCategory(null);
        }}
        editingCategory={editingCategory}
        churchId={churchId}
        onSuccess={(updated) => {
          if (editingCategory) {
            setCategories(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
          } else {
            setCategories(prev => [...prev, { ...updated, _count: { events: 0 } }]);
          }
          setIsFormOpen(false);
        }}
      />

      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && !isPending && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDeleteDesc")} <strong>{categoryToDelete?.name}</strong> {t("confirmDeleteDesc2")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}