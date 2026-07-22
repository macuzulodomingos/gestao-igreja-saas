"use client";

import { useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Church, Loader2, Eye, EyeOff } from "lucide-react";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { resetPasswordAction } from "@/app/actions/password-reset";
import { toast } from "sonner";

function ResetPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const t = useTranslations("auth.resetPassword");
  const tv = useTranslations("validation");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const translateError = (code: string) => {
    const keys: Record<string, string> = {
      passwordTooShort: tv("passwordTooShort"),
      passwordUppercase: tv("passwordUppercase"),
      passwordNumber: tv("passwordNumber"),
      passwordMismatch: tv("passwordMismatch"),
      invalidToken: t("invalidToken"),
    };
    return keys[code] ?? t("error");
  };

  if (!token) {
    return (
      <p className="text-sm text-destructive text-center">{t("missingToken")}</p>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("token", token);

    startTransition(async () => {
      try {
        const result = await resetPasswordAction(formData);
        if (result.success) {
          toast.success(t("successReset"));
          router.push("/login");
        } else if (result.fieldErrors) {
          const firstError = Object.values(result.fieldErrors)[0]?.[0];
          setError(firstError ? translateError(firstError.replace("validation.", "")) : t("error"));
        } else {
          setError(translateError(result.errorCode ?? "error"));
        }
      } catch (err) {
        console.error("[RESET_PASSWORD_SUBMIT_ERROR]:", err);
        setError(t("error"));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p role="alert" className="text-sm text-destructive text-center">{error}</p>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">
          {t("newPassword")}
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            className="w-full rounded-md border px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="confirmPassword">
          {t("confirmPassword")}
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            className="w-full rounded-md border px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showConfirmPassword ? t("hidePassword") : t("showPassword")}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center justify-center w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("saving")}
          </>
        ) : t("submit")}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations("auth.resetPassword");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm space-y-6">

        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Church className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="rounded-lg border bg-card p-8 shadow-sm">
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline font-medium">
            {t("backToLogin")}
          </Link>
        </p>

      </div>
    </div>
  );
}