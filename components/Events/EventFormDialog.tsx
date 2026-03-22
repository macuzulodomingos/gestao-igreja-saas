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
import { eventSchema } from "@/lib/validations/event";
import { saveEventAction } from "@/app/actions/event-actions";
import { ChurchEvent, EventCategory, EventListDepartment } from "@/types/event";

type FormData = z.infer<typeof eventSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ChurchEvent | null;
  departments: EventListDepartment[];
  categories: EventCategory[]; // 👈 novo
}

export function EventFormDialog({ open, onOpenChange, event, departments, categories }: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      date: "",
      time: "",
      departmentId: "none",
    },
  });

  useEffect(() => {
    if (open) {
      if (event) {
        // 👈 extrai date e time do startAt usando timezone do navegador
        const startAt = new Date(event.startAt);
        const date = startAt.toLocaleDateString("en-CA"); // formato YYYY-MM-DD
        const time = startAt.toLocaleTimeString("pt-AO", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        form.reset({
          name: event.name,
          description: event.description || "",
          categoryId: event.categoryId,
          date,
          time,
          departmentId: event.departmentId || "none",
        });
      } else {
        form.reset({
          name: "",
          description: "",
          categoryId: categories[0]?.id ?? "",
          date: new Date().toLocaleDateString("en-CA"),
          time: "09:00",
          departmentId: "none",
        });
      }
    }
  }, [event, open, form, categories]);

  const handleSubmit = (data: FormData) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description || "");
      formData.append("categoryId", data.categoryId);
      formData.append("date", data.date);
      formData.append("time", data.time);
      formData.append("departmentId", data.departmentId || "none");

      const result = await saveEventAction(formData, event?.id ?? undefined);

      if (result.success) {
        toast.success(event ? "Evento actualizado!" : "Evento criado!");
        onOpenChange(false);
      } else if (result.fieldErrors) {
        toast.error("Verifique os erros no formulário.");
      } else {
        toast.error(result.error || "Erro ao salvar evento.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{event ? "Editar Evento" : "Adicionar Evento"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Evento</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Culto de Domingo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* 👈 Categoria dinâmica em vez de type fixo */}
            <FormField control={form.control} name="categoryId" render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <SelectItem value="no-categories" disabled>
                        Nenhuma categoria — crie em Configurações
                      </SelectItem>
                    ) : (
                      categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="time" render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora</FormLabel>
                  <FormControl><Input type="time" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="departmentId" render={({ field }) => (
              <FormItem>
                <FormLabel>Departamento (Opcional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o departamento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sem departamento</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição (Opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Breve descrição do evento..."
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : event ? "Salvar alterações" : "Adicionar Evento"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}