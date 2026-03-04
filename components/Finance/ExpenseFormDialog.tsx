"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { saveTransactionAction } from "@/app/actions/finance";

const schema = z.object({
  date: z.string().min(1, "Data obrigatória"),
  categoryId: z.string().min(1, "Categoria obrigatória"),
  amount: z.string().min(1, "Valor obrigatório").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Valor deve ser positivo"
  ),
  description: z.string().max(200).optional(),
});

type FormData = z.infer<typeof schema>;
type Category = { id: string; name: string };
type Transaction = { id: string; description: string; amount: number; category: string; date: Date };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: Transaction | null;
  categories: Category[];
}

export function ExpenseFormDialog({ open, onOpenChange, entry, categories }: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: "", categoryId: "", amount: "", description: "" },
  });

  useEffect(() => {
    if (open) {
      if (entry) {
        const cat = categories.find(c => c.name === entry.category);
        form.reset({
          date: new Date(entry.date).toISOString().split("T")[0],
          categoryId: cat?.id || "",
          amount: entry.amount.toString(),
          description: entry.description || "",
        });
      } else {
        form.reset({
          date: new Date().toISOString().split("T")[0],
          categoryId: categories[0]?.id || "",
          amount: "",
          description: "",
        });
      }
    }
  }, [entry, open, categories, form]);

  const handleSubmit = (data: FormData) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("description", data.description || "Despesa");
      formData.append("amount", data.amount);
      formData.append("type", "EXPENSE");        // 👈 única diferença
      formData.append("categoryId", data.categoryId);
      formData.append("date", data.date);

      const result = await saveTransactionAction(formData);

      if (result.success) {
        toast.success("Despesa registada!");
        onOpenChange(false);
      } else {
        toast.error(result.error || "Erro ao registar despesa.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{entry ? "Editar Despesa" : "Registar Despesa"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="categoryId" render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="amount" render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (Kz)</FormLabel>
                <FormControl><Input type="number" min="0" step="0.01" placeholder="0.00" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição (Opcional)</FormLabel>
                <FormControl><Textarea placeholder="Breve descrição da despesa..." className="resize-none" rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : entry ? "Salvar" : "Registar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}