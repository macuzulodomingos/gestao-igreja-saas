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
import { saveDepartmentAction } from "@/app/actions/department-actions";

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
  leaderId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type Department = {
  id: string;
  name: string;
  description: string | null;
  leaderId: string | null;
};

type Member = {
  id: string;
  name: string;
  role: { name: string } | null;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
  members: Member[];
  onUpgrade?: (message: string) => void; // 👈 NOVO
}

export function DepartmentFormDialog({ open, onOpenChange, department, members, onUpgrade }: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", leaderId: "none" },
  });

  useEffect(() => {
    if (open) {
      if (department) {
        form.reset({
          name: department.name,
          description: department.description || "",
          leaderId: department.leaderId || "none",
        });
      } else {
        form.reset({ name: "", description: "", leaderId: "none" });
      }
    }
  }, [department, open, form]);

  const handleSubmit = (data: FormData) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description || "");
      formData.append("leaderId", data.leaderId || "none");

      const result = await saveDepartmentAction(
        formData,
        department?.id ?? undefined
      );

      if (result.success) {
        toast.success(department ? "Departamento actualizado!" : "Departamento criado!");
        onOpenChange(false);
      } else if ("upgrade" in result && result.upgrade) {
        // 👈 fecha o form e mostra modal de upgrade
        onOpenChange(false);
        onUpgrade?.(result.error || "Limite do plano atingido.");
      } else {
        toast.error(result.error || "Erro ao salvar departamento.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {department ? "Editar Departamento" : "Adicionar Departamento"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Departamento</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Ministério de Adoração" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="leaderId" render={({ field }) => (
              <FormItem>
                <FormLabel>Líder (Opcional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o líder" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sem líder</SelectItem>
                    {members.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} {member.role ? `(${member.role.name})` : ""}
                      </SelectItem>
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
                    placeholder="Breve descrição deste departamento..."
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
                  : department ? "Salvar alterações" : "Adicionar Departamento"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}