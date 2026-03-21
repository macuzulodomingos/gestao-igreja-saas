"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { saveEventCategoryAction } from "@/app/actions/event-category-actions";

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100, "Máximo 100 caracteres"),
});

type FormData = z.infer<typeof schema>;

type EventCategory = {
  id: string;
  name: string;
};

interface EventCategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory: EventCategory | null;
  onSuccess: (category: EventCategory) => void;
}

export function EventCategoryFormDialog({
  open,
  onOpenChange,
  editingCategory,
  onSuccess,
}: EventCategoryFormDialogProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  // 👈 mesmo padrão do RoleFormDialog
  useEffect(() => {
    if (open) {
      form.reset({ name: editingCategory?.name ?? "" });
    }
  }, [open, editingCategory, form]);

  const handleSubmit = (data: FormData) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", data.name);

      const result = await saveEventCategoryAction(formData, editingCategory?.id);

      if (result.success) {
        toast.success(editingCategory ? "Categoria actualizada." : "Categoria criada.");
        onSuccess({
          id: result.id!, // 👈 id real do banco — nunca crypto.randomUUID()
          name: data.name,
        });
        onOpenChange(false);
      } else if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof FormData, { message: messages[0] });
        });
        toast.error("Verifique os erros no formulário.");
      } else {
        toast.error(result.error || "Erro ao guardar.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Oração, Culto, Ensaio" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A guardar...</>
                ) : (
                  editingCategory ? "Actualizar" : "Criar"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}