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
import { saveRoleAction } from "@/app/actions/member-role-actions";
import { MemberRole } from "@/types/role";

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(50, "Máximo 50 caracteres"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: MemberRole | null;
}

export function RoleFormDialog({ open, onOpenChange, role }: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: role?.name ?? "" });
    }
  }, [open, role, form]);

  const handleSubmit = (data: FormData) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", data.name);

      const result = await saveRoleAction(formData, role?.id);

      if (result.success) {
        toast.success(role ? "Cargo actualizado!" : "Cargo criado!");
        onOpenChange(false);
      } else {
        toast.error(result.error || "Erro ao salvar cargo.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{role ? "Editar Cargo" : "Novo Cargo"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Cargo</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Pastor, Diácono, Secretário..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : role ? "Salvar" : "Criar"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}