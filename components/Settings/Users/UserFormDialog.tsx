"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { createUserAction, updateUserAction } from "@/app/actions/user-actions";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { UserRole } from "@/app/generated/prisma/enums";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  createdAt: Date;
};

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: User | null;
  onSuccess: (user: User) => void;
  onUpgrade?: (message: string) => void;
  churchId: string;
}

export function UserFormDialog({ open, onOpenChange, editingUser, onSuccess, onUpgrade, churchId }: UserFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const isEditing = !!editingUser;
  const t = useTranslations("users.form");
  const tc = useTranslations("common");
  const tu = useTranslations("users");
  const te = useTranslations("users.errors");
  const tv = useTranslations("validation");

  const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
    { value: UserRole.TREASURER, label: tu("roles.TREASURER") },
    { value: UserRole.SECRETARY, label: tu("roles.SECRETARY") },
    { value: UserRole.OPERATOR, label: tu("roles.OPERATOR") },
  ];

  // Mapa estático — cada chave chamada literalmente (validada em compile-time
  // pelo next-intl). O lookup dinâmico acontece só no objeto já traduzido,
  // nunca passando uma string arbitrária para te()/tv() diretamente.
  const errorMessages: Record<string, string> = {
    unauthorized: te("unauthorized"),
    forbidden: te("forbidden"),
    planLimitUsers: te("planLimitUsers"),
    emailTaken: te("emailTaken"),
    cannotEditSelf: te("cannotEditSelf"),
    cannotEditAdmin: te("cannotEditAdmin"),
    cannotDeleteSelf: te("cannotDeleteSelf"),
    cannotDeleteAdmin: te("cannotDeleteAdmin"),
    cannotDeleteLastSuperAdmin: te("cannotDeleteLastSuperAdmin"),
    userNotFound: te("userNotFound"),
    errorSave: te("errorSave"),
    errorDelete: te("errorDelete"),
  };

  // Idem para as chaves de validação que o schema Zod (create/updateUserSchema)
  // pode devolver em fieldErrors.
  const validationMessages: Record<string, string> = {
    required: tv("required"),
    nameRequired: tv("nameRequired"),
    nameTooLong: tv("nameTooLong"),
    emailInvalid: tv("emailInvalid"),
    passwordTooShort: tv("passwordTooShort"),
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = isEditing
          ? await updateUserAction(editingUser.id, formData, churchId)
          : await createUserAction(formData, churchId);

        if (result.success) {
          toast.success(isEditing ? t("updated") : t("created"));
          onSuccess(result.data);
        } else if (result.upgrade) {
          onOpenChange(false);
          onUpgrade?.(result.errorCode ? (errorMessages[result.errorCode] ?? tc("upgrade")) : tc("upgrade"));
        } else if (result.fieldErrors) {
          const translated: Record<string, string[]> = {};
          for (const [key, msgs] of Object.entries(result.fieldErrors)) {
            translated[key] = msgs.map(msg => {
              if (msg.startsWith("validation.")) {
                const validationKey = msg.replace("validation.", "");
                return validationMessages[validationKey] ?? msg;
              }
              if (msg.startsWith("users.errors.")) {
                const errorKey = msg.replace("users.errors.", "");
                return errorMessages[errorKey] ?? msg;
              }
              return msg;
            });
          }
          setFieldErrors(translated);
          toast.error(t("errorForm"));
        } else {
          toast.error(result.errorCode ? (errorMessages[result.errorCode] ?? t("error")) : t("error"));
        }
      } catch (error) {
        console.error("[USER_FORM_SUBMIT_ERROR]:", error);
        toast.error(t("error"));
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (isPending) return;
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("editTitle") : t("addTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label htmlFor="user-name" className="text-sm font-medium">{t("name")}</label>
            <Input
              id="user-name"
              name="name"
              placeholder={t("namePlaceholder")}
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
                <label htmlFor="user-email" className="text-sm font-medium">{t("email")}</label>
                <Input
                  id="user-email"
                  name="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  className={fieldErrors.email ? "border-destructive" : ""}
                />
                {fieldErrors.email && (
                  <p className="text-xs text-destructive">{fieldErrors.email[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="user-password" className="text-sm font-medium">{t("password")}</label>
                <Input
                  id="user-password"
                  name="password"
                  type="password"
                  placeholder={t("passwordPlaceholder")}
                  className={fieldErrors.password ? "border-destructive" : ""}
                />
                {fieldErrors.password && (
                  <p className="text-xs text-destructive">{fieldErrors.password[0]}</p>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <label htmlFor="user-role" className="text-sm font-medium">{t("role")}</label>
            <select
              id="user-role"
              name="role"
              defaultValue={editingUser?.role ?? UserRole.OPERATOR}
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("saving")}</>
              ) : (
                isEditing ? t("save") : t("create")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}