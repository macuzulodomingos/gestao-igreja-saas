"use client";

import { useFormField } from "@/components/ui/form";
import { useTranslations } from "next-intl";

export function TranslatedFormMessage() {
  const { error } = useFormField();
  const t = useTranslations();

  if (!error?.message) return null;

  // 👈 tenta traduzir — se a chave não existir, mostra a mensagem original
  let message = error.message;
  try {
    message = t(error.message as any);
  } catch {
    // mantém a mensagem original
  }

  return (
    <p className="text-sm font-medium text-destructive">{message}</p>
  );
}