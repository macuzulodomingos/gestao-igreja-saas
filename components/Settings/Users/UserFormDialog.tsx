"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { createUserAction, updateUserAction } from "@/app/actions/user-actions";
import { toast } from "sonner";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
};

const ROLE_OPTIONS = [
  { value: "TREASURER", label: "Tesoureiro" },
  { value: "SECRETARY", label: "Secretário" },
  { value: "OPERATOR", label: "Operador" },
];

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: User | null;
  onSuccess: (user: User) => void;
}

export function UserFormDialog({ open, onOpenChange, editingUser, onSuccess }: UserFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const isEditing = !!editingUser;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = isEditing
        ? await updateUserAction(editingUser.id, formData)
        : await createUserAction(formData);

      if (result.success) {
        toast.success(isEditing ? "Utilizador actualizado." : "Utilizador criado.");
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const role = formData.get("role") as string;
        onSuccess({
          id: editingUser?.id ?? crypto.randomUUID(),
          name: name || editingUser?.name || null,
          email: email || editingUser?.email || "",
          role: role || editingUser?.role || "OPERATOR",
          createdAt: editingUser?.createdAt ?? new Date(),
        });
      } else if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors); // 👈 mostra erros por campo
        toast.error("Verifique os erros no formulário.");
      } else {
        toast.error(result.error || "Erro ao guardar.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Utilizador" : "Novo Utilizador"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome</label>
            <Input
              name="name"
              placeholder="Nome completo"
              defaultValue={editingUser?.name ?? ""}
              className={fieldErrors.name ? "border-destructive" : ""}
            />
            {fieldErrors.name && (
              <p className="text-xs text-destructive">{fieldErrors.name[0]}</p>
            )}
          </div>

          {!isEditing && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail</label>
                <Input
                  name="email"
                  type="email"
                  placeholder="email@igreja.com"
                  className={fieldErrors.email ? "border-destructive" : ""}
                />
                {fieldErrors.email && (
                  <p className="text-xs text-destructive">{fieldErrors.email[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Palavra-passe</label>
                <Input
                  name="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  className={fieldErrors.password ? "border-destructive" : ""}
                />
                {fieldErrors.password && (
                  <p className="text-xs text-destructive">{fieldErrors.password[0]}</p>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Cargo</label>
            <select
              name="role"
              defaultValue={editingUser?.role ?? "OPERATOR"}
              className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${fieldErrors.role ? "border-destructive" : ""}`}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {fieldErrors.role && (
              <p className="text-xs text-destructive">{fieldErrors.role[0]}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A guardar...</>
              ) : (
                isEditing ? "Actualizar" : "Criar Utilizador"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}