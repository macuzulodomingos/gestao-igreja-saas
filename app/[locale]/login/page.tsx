"use client";

import { useState } from "react";
import { authenticate } from "@/app/actions/auth";
import { Church } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const t = useTranslations("auth");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const result = await authenticate(formData);

    setPending(false);

    if (!result) {
      setError(t("error"));
      return;
    }

    if (result.success && result.redirectTo) {
      // 👈 redirect com locale correcto do utilizador
      window.location.href = result.redirectTo;
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
              placeholder="pastor@igreja.com"
              required
              className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
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
              required
              className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? t("loading") : t("loginButton")}
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