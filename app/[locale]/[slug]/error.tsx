"use client";

import { useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");
  const [isPending, startTransition] = useTransition();
  const params = useParams();

  useEffect(() => {
    console.error("[APP_ERROR]:", error);
    Sentry.captureException(error, {
      tags: {
        digest: error.digest,
        slug: typeof params.slug === "string" ? params.slug : undefined,
      },
    });
  }, [error, params.slug]);

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
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("description")}</p>
      </div>
      <Button onClick={handleReset} variant="outline" disabled={isPending}>
        {isPending ? t("trying") : t("retry")}
      </Button>
    </div>
  );
}