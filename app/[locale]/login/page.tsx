"use client";

import { authenticate } from "@/app/actions/auth";
import { Church, Loader2, Eye, EyeOff } from "lucide-react";
import { Link, useRouter as useLocaleRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useRouter as useNextRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Image from "next/image";



// 2. 👈 cria este subcomponente ANTES do LoginPage
function RegistrationAlert() {
  const t = useTranslations("auth");
  const router = useLocaleRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "true";

  // 👈 limpa ?registered=true da URL após montar
  useEffect(() => {
    if (justRegistered) {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("registered");
      router.replace(`?${newParams.toString()}`, { scroll: false });
    }
  }, [justRegistered, searchParams, router]);

  if (!justRegistered) return null;

  return (
    <div className="rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 p-3 text-center">
      <p className="text-sm text-green-700 dark:text-green-400">
        {t("registeredSuccess")}
      </p>
    </div>
  );
}


export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const t = useTranslations("auth");

  const router = useNextRouter();

  const translateError = (code: string) => {
    const validCodes: Record<string, string> = {
      invalidCredentials: t("invalidCredentials"),
      authError: t("authError"),
    };
    return validCodes[code] ?? t("error"); // fallback seguro
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await authenticate(formData);

      if (result.success) {
        router.push(result.redirectTo);
        return;
      }

      // 👈 TypeScript sabe que errorCode existe aqui
      setError(translateError(result.errorCode ?? "authError"));

    } catch (error) {
      console.error("[LOGIN_ERROR]:", error);
      setError(t("error"));
    } finally {
      setPending(false);
    }
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
          <h1 className="text-2xl font-bold">Ngunga</h1>
          <p className="text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <Suspense fallback={null}>
          <RegistrationAlert />
        </Suspense>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-8 shadow-sm">
          {error && (
            <p role="alert" className="text-sm text-destructive text-center">{error}</p>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              {t("email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email" // 👈
              required
              className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              {t("password")}
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
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

          <div className="flex justify-end">
            <Link href="/esqueci-senha" className="text-xs text-primary hover:underline">
              {t("forgotPasswordLink")}
            </Link>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="flex items-center justify-center w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {pending ? ( // 👈 spinner
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("loading")}
              </>
            ) : t("loginButton")}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link href="/registar" className="text-primary hover:underline font-medium">
            {t("register")}
          </Link>
        </p>

      </div>
    </div>
  );
}