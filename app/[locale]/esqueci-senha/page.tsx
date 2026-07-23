"use client";

import { useState, useTransition } from "react";
import { Church, Loader2, CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { requestPasswordResetAction } from "@/app/actions/password-reset";
import { toast } from "sonner";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const t = useTranslations("auth.forgotPassword");
  const locale = useLocale() as "pt" | "fr";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await requestPasswordResetAction(formData, locale);
        if (result.success) {
          setSubmitted(true);
        } else {
          toast.error(t("error"));
        }
      } catch (error) {
        console.error("[FORGOT_PASSWORD_ERROR]:", error);
        toast.error(t("error"));
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm space-y-6">

        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-10 w-42 items-center bg-primary/4 justify-center rounded-xl shrink-0">
            <Image
              src="/logo-icon.png"
              alt="Ngunga"
              width={48}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="rounded-lg border bg-card p-8 shadow-sm">
          {submitted ? (
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="text-sm text-muted-foreground">{t("checkEmail")}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">
                  {t("email")}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="flex items-center justify-center w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("sending")}
                  </>
                ) : t("submit")}
              </button>
            </form>
          )}
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