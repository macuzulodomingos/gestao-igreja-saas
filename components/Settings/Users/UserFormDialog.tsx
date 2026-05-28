"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { createUserAction, updateUserAction } from "@/app/actions/user-actions";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
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

  const ROLE_OPTIONS = [
    { value: "TREASURER", label: tu("roles.TREASURER") },
    { value: "SECRETARY", label: tu("roles.SECRETARY") },
    { value: "OPERATOR", label: tu("roles.OPERATOR") },
  ];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = isEditing
        ? await updateUserAction(editingUser.id, formData, churchId)
        : await createUserAction(formData, churchId);

      if (result.success) {
        toast.success(isEditing ? t("updated") : t("created"));
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
      } else if ("upgrade" in result && result.upgrade) {
        onOpenChange(false);
        // 👈 usa errorCode em vez de error
        const errorCode = (result as any).errorCode;
        onUpgrade?.(errorCode ? te(errorCode) : tc("upgrade"));
      } else if (result.fieldErrors) {
        const translated: Record<string, string[]> = {};
        for (const [key, msgs] of Object.entries(result.fieldErrors)) {
          translated[key] = msgs.map(msg => {
            if (msg.startsWith("validation.")) {
              try { return tv(msg.replace("validation.", "") as any); } catch { return msg; }
            }
            if (msg.startsWith("users.errors.")) {
              try { return te(msg.replace("users.errors.", "") as any); } catch { return msg; }
            }
            return msg;
          });
        }
        setFieldErrors(translated);
        toast.error(t("errorForm"));
      } else {
        const errorCode = (result as any).errorCode;
        toast.error(errorCode ? te(errorCode) : t("error"));
      }
    });
  }; // 👈 handleSubmit termina aqui

  return ( // 👈 return fora do handleSubmit
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("editTitle") : t("addTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("name")}</label>
            <Input
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
                <label className="text-sm font-medium">{t("email")}</label>
                <Input
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
                <label className="text-sm font-medium">{t("password")}</label>
                <Input
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
            <label className="text-sm font-medium">{t("role")}</label>
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