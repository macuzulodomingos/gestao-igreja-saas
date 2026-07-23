"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useTransition } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    console.error("[GLOBAL_ERROR]:", error);
    Sentry.captureException(error, {
      tags: {
        digest: error.digest,
      },
    });
  }, [error]);

  const handleReset = () => {
    startTransition(() => {
      reset();
    });
  };

  return (
    <html lang="pt">
      <body className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground font-sans antialiased">
        <div
          role="alert"
          aria-live="assertive"
          className="flex flex-col items-center gap-4 text-center p-6"
        >
          <h1 className="text-2xl font-bold tracking-tight">Algo correu mal</h1>
          <p className="text-sm text-muted-foreground">
            Ocorreu um erro crítico. Tente recarregar a página.
          </p>
          <button
            onClick={handleReset}
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isPending ? "A tentar novamente..." : "Tentar novamente"}
          </button>
        </div>
      </body>
    </html>
  );
}