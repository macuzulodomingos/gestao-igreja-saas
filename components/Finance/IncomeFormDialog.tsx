"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IncomeEntry } from "@/lib/mock-data";
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

const incomeFormSchema = z.object({
  date: z.string().min(1, "A data é obrigatória"),
  type: z.enum(["Dízimo", "Oferta", "Doação", "Outro"]),
  amount: z
    .string()
    .min(1, "O valor é obrigatório")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "O valor deve ser um número positivo.",
    ),
  description: z.string().max(200).optional(),
});

type IncomeFormData = z.infer<typeof incomeFormSchema>;

interface IncomeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: IncomeEntry | null;
  onSave: (data: Omit<IncomeEntry, "id">) => void;
}

export function IncomeFormDialog({
  open,
  onOpenChange,
  entry,
  onSave,
}: IncomeFormDialogProps) {
  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      date: "",
      type: "Dízimo",
      amount: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (entry) {
        form.reset({
          date: entry.date,
          type: entry.type as any, // Garantindo compatibilidade de tipo
          amount: entry.amount.toString(),
          description: entry.description || "",
        });
      } else {
        form.reset({
          // 3. Corrigido: Pegar a data local correta (YYYY-MM-DD) sem problemas de fuso horário
          date: new Date().toLocaleDateString("pt-AO"),
          type: "Dízimo",
          amount: "",
          description: "",
        });
      }
    }
  }, [entry, open, form]);

  const handleSubmit = (data: IncomeFormData) => {
    onSave({
      date: data.date,
      type: data.type,
      amount: Number(data.amount),
      description: data.description || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {entry ? "Editar entrada de receita" : "Adicionar Receita"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
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
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de receita" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Dízimo">Dízimo</SelectItem>
                      <SelectItem value="Oferta">Oferta</SelectItem>
                      <SelectItem value="Doação">Doação</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
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
                  <FormLabel>Quantia (kz)</FormLabel>
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
                      placeholder="Breve descrição..."
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
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {entry ? "Salvar Alterações" : "Adicionar Receita"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
