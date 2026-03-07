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
import { saveEventAction } from "@/app/actions/event-actions";
import { ChurchEvent, EventListDepartment, EventType } from "@/types/event";

const eventTypeLabels: Record<EventType, string> = {
  SERVICO: "Serviço",
  REUNIAO: "Reunião",
  ENSAIO: "Ensaio",
  CONFERENCIA: "Conferência",
  OUTRO: "Outro",
};

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100),
  description: z.string().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
  type: z.enum(["SERVICO", "REUNIAO", "ENSAIO", "CONFERENCIA", "OUTRO"]),
  date: z.string().min(1, "Data obrigatória"),
  time: z.string().min(1, "Hora obrigatória"),
  departmentId: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ChurchEvent | null;
  departments: EventListDepartment[];
}

export function EventFormDialog({ open, onOpenChange, event, departments }: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      type: "SERVICO",
      date: "",
      time: "",
      departmentId: "none",
    },
  });

  useEffect(() => {
    if (open) {
      if (event) {
        form.reset({
          name: event.name,
          description: event.description || "",
          type: event.type,
          date: new Date(event.date).toISOString().split("T")[0],
          time: event.time,
          departmentId: event.departmentId || "none",
        });
      } else {
        form.reset({
          name: "",
          description: "",
          type: "SERVICO",
          date: new Date().toISOString().split("T")[0],
          time: "09:00",
          departmentId: "none",
        });
      }
    }
  }, [event, open, form]);

  const handleSubmit = (data: FormData) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description || "");
      formData.append("type", data.type);
      formData.append("date", data.date);
      formData.append("time", data.time);
      formData.append("departmentId", data.departmentId || "none");

      const result = await saveEventAction(formData, event?.id ?? undefined);

      if (result.success) {
        toast.success(event ? "Evento actualizado!" : "Evento criado!");
        onOpenChange(false);
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

            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.keys(eventTypeLabels) as EventType[]).map(type => (
                      <SelectItem key={type} value={type}>
                        {eventTypeLabels[type]}
                      </SelectItem>
                    ))}
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
                    <SelectTrigger><SelectValue placeholder="Selecione o departamento" /></SelectTrigger>
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