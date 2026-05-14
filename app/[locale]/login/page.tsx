"use client";

import { useState } from "react";
import { authenticate } from "@/app/actions/auth";
import { Church, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";



export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const t = useTranslations("auth");

  const router = useRouter();

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

    } catch {
      setError(t("error"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm space-y-6">

        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Church className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Ngunga</h1>
          <p className="text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-8 shadow-sm">
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
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
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password" // 👈
              required
              className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
            />
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