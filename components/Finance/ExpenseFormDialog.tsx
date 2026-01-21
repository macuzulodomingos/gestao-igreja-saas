"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ExpenseEntry } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const expenseFormSchema = z.object({
  date: z.string().min(1, "A data é obrigatória"),
  category: z.enum(["Rent", "Utilities", "Maintenance", "Supplies", "Salaries", "Other"]),
  amount: z.string().min(1, "O valor é obrigatório").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "O valor deve ser um número positivo"
  ),
  description: z.string().max(200).optional(),
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: ExpenseEntry | null;
  onSave: (data: Omit<ExpenseEntry, "id">) => void;
}

export function ExpenseFormDialog({ open, onOpenChange, entry, onSave }: ExpenseFormDialogProps) {
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      date: "",
      category: "Utilities",
      amount: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (entry) {
        form.reset({
          date: entry.date,
          category: entry.category,
          amount: entry.amount.toString(),
          description: entry.description || "",
        });
      } else {
        form.reset({
          // Define a data local atual no formato YYYY-MM-DD
          date: new Date().toLocaleDateString('en-CA'),
          category: "Utilities",
          amount: "",
          description: "",
        });
      }
    }
  }, [entry, open, form]);

  const handleSubmit = (data: ExpenseFormData) => {
    onSave({
      date: data.date,
      category: data.category,
      amount: Number(data.amount),
      description: data.description || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{entry ? "Editar Despesa" : "Adicionar Despesa"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Rent">Renda / Aluguer</SelectItem>
                      <SelectItem value="Utilities">Serviços (Água/Luz)</SelectItem>
                      <SelectItem value="Maintenance">Manutenção</SelectItem>
                      <SelectItem value="Supplies">Suprimentos</SelectItem>
                      <SelectItem value="Salaries">Salários</SelectItem>
                      <SelectItem value="Other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (Kz)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Breve descrição da despesa..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{entry ? "Salvar Alterações" : "Registar Despesa"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}