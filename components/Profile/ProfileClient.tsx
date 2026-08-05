"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, User, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { updateProfileAction, changePasswordAction } from "@/app/actions/profile-actions";
import { useRouter } from "@/i18n/navigation";

export function ProfileClient({ userName, userEmail }: { userName: string; userEmail: string }) {
  const t = useTranslations("profile");
  const tv = useTranslations("validation");
  const router = useRouter();

  const [isPendingName, startNameTransition] = useTransition();
  const [isPendingPassword, startPasswordTransition] = useTransition();
  const [nameErrors, setNameErrors] = useState<Record<string, string[]>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string[]>>({});
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const translateError = (msg: string) => {
    const validationKeys: Record<string, string> = {
      nameRequired: tv("nameRequired"),
      nameTooLong: tv("nameTooLong"),
      passwordTooShort: tv("passwordTooShort"),
      passwordUppercase: tv("passwordUppercase"),
      passwordNumber: tv("passwordNumber"),
      passwordMismatch: tv("passwordMismatch"),
      required: tv("required"),
    };
    const profileKeys: Record<string, string> = {
      wrongCurrentPassword: t("errors.wrongCurrentPassword"),
    };

    if (msg.startsWith("validation.")) {
      const key = msg.replace("validation.", "");
      return validationKeys[key] ?? msg;
    }
    if (msg.startsWith("profile.errors.")) {
      const key = msg.replace("profile.errors.", "");
      return profileKeys[key] ?? msg;
    }
    return msg;
  };

  const handleUpdateName = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNameErrors({});
    const formData = new FormData(e.currentTarget);

    startNameTransition(async () => {
      try {
        const result = await updateProfileAction(formData);
        if (result.success) {
          toast.success(t("nameUpdated"));
          router.refresh();
        } else if (result.fieldErrors) {
          setNameErrors(result.fieldErrors);
        } else {
          toast.error(t("errorSave"));
        }
      } catch (error) {
        console.error("[UPDATE_PROFILE_SUBMIT_ERROR]:", error);
        toast.error(t("errorSave"));
      }
    });
  };

  const handleChangePassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordErrors({});
    const formData = new FormData(e.currentTarget);

    startPasswordTransition(async () => {
      try {
        const result = await changePasswordAction(formData);
        if (result.success) {
          toast.success(t("passwordUpdated"));
          (e.target as HTMLFormElement).reset();
        } else if (result.fieldErrors) {
          setPasswordErrors(result.fieldErrors);
        } else {
          toast.error(t("errorSave"));
        }
      } catch (error) {
        console.error("[CHANGE_PASSWORD_SUBMIT_ERROR]:", error);
        toast.error(t("errorSave"));
      }
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-5 w-5" /> {t("personalInfo")}
          </CardTitle>
          <CardDescription>{t("personalInfoDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateName} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">{t("email")}</label>
              <Input id="email" value={userEmail} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">{t("emailImmutable")}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="name">{t("name")}</label>
              <Input
                id="name"
                name="name"
                defaultValue={userName}
                className={nameErrors.name ? "border-destructive" : ""}
              />
              {nameErrors.name && (
                <p className="text-xs text-destructive">{translateError(nameErrors.name[0])}</p>
              )}
            </div>

            <Button type="submit" disabled={isPendingName}>
              {isPendingName ? <Loader2 className="h-4 w-4 animate-spin" /> : t("saveName")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-5 w-5" /> {t("changePassword")}
          </CardTitle>
          <CardDescription>{t("changePasswordDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="currentPassword">{t("currentPassword")}</label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  autoComplete="current-password"
                  className={passwordErrors.currentPassword ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showCurrent ? t("hidePassword") : t("showPassword")}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-xs text-destructive">{translateError(passwordErrors.currentPassword[0])}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="newPassword">{t("newPassword")}</label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  className={passwordErrors.newPassword ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showNew ? t("hidePassword") : t("showPassword")}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="text-xs text-destructive">{translateError(passwordErrors.newPassword[0])}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="confirmPassword">{t("confirmPassword")}</label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                className={passwordErrors.confirmPassword ? "border-destructive" : ""}
              />
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-destructive">{translateError(passwordErrors.confirmPassword[0])}</p>
              )}
            </div>

            <Button type="submit" disabled={isPendingPassword}>
              {isPendingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : t("savePassword")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}