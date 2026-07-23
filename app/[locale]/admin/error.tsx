"use client";

import { useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    console.error("[ADMIN_ERROR]:", error);
    Sentry.captureException(error, {
      tags: {
        digest: error.digest,
        area: "admin",
      },
    });
  }, [error]);

  const handleReset = () => {
    startTransition(() => {
      reset();
    });
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center justify-center py-24 gap-4 text-center"
    >
      <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden="true" />
      <div>
        <h2 className="text-lg font-semibold">Algo correu mal</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ocorreu um erro inesperado no painel de administração.
        </p>
      </div>
      <Button onClick={handleReset} variant="outline" disabled={isPending}>
        {isPending ? "A tentar..." : "Tentar novamente"}
      </Button>
    </div>
  );
}