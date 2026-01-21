"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Department, members } from "@/lib/mock-data";
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

// Schema de validação do formulário
const departmentFormSchema = z.object({
  name: z.string().min(1, "O nome do departamento é obrigatório").max(100),
  leaderId: z.string().optional(),
  description: z.string().max(500).optional(),
});

type DepartmentFormData = z.infer<typeof departmentFormSchema>;

// Props do componente
interface DepartmentFormDialogProps {
  aberto: boolean;
  aoMudarAberto: (aberto: boolean) => void;
  departamento: Department | null;
  aoSalvar: (data: Omit<Department, "id" | "memberIds">) => void;
}

export function DepartmentFormDialog({
  aberto,
  aoMudarAberto,
  departamento,
  aoSalvar,
}: DepartmentFormDialogProps) {
  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      leaderId: "none", // valor padrão para nenhum líder
      description: "",
    },
  });

  // Atualiza valores do form quando o departamento muda
  useEffect(() => {
    if (departamento) {
      form.reset({
        name: departamento.name,
        leaderId: departamento.leaderId || "none",
        description: departamento.description || "",
      });
    } else {
      form.reset({
        name: "",
        leaderId: "none",
        description: "",
      });
    }
  }, [departamento, form]);

  // Função de submit
  const handleSubmit = (data: DepartmentFormData) => {
    aoSalvar({
      name: data.name,
      leaderId: data.leaderId === "none" ? undefined : data.leaderId,
      description: data.description || undefined,
    });
  };

  // Somente membros ativos para o select de líderes
  const activeMembers = members.filter((m) => m.status === "Activo");

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAberto}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {departamento ? "Editar Departamento" : "Adicionar Novo Departamento"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Nome do departamento */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Departamento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Ministério de Adoração" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Líder do departamento */}
            <FormField
              control={form.control}
              name="leaderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Líder (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o líder" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Placeholder "Nenhum" com valor válido */}
                      <SelectItem value="none" disabled>Nenhum</SelectItem>
                      {activeMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} ({member.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Breve descrição deste ministério..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => aoMudarAberto(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {departamento ? "Salvar alterações" : "Adicionar Departamento"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
