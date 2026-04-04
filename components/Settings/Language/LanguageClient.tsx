"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Languages, Check, Loader2 } from "lucide-react";
import { updateLocaleAction } from "@/app/actions/locale-actions";
import { toast } from "sonner";

const LANGUAGES = [
  {
    code: "pt" as const,
    name: "Português",
    flag: "🇦🇴",
    description: "Interface em Português",
  },
  {
    code: "fr" as const,
    name: "Français",
    flag: "🇨🇩",
    description: "Interface en Français",
  },
];

interface LanguageClientProps {
  currentLocale: "pt" | "fr";
  slug: string;
}

export function LanguageClient({ currentLocale, slug }: LanguageClientProps) {
  const [selected, setSelected] = useState(currentLocale);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateLocaleAction(selected);
    setSaving(false);

    if (result.success) {
      // 👈 mensagem na língua seleccionada — intencional
      toast.success(selected === "pt" ? "Idioma actualizado!" : "Langue mise à jour!");
      window.location.href = `/${selected}/${slug}/configuracoes/idioma`;
    } else {
      // 👈 mensagem nas duas línguas — utilizador pode não saber qual é a sua
      toast.error("Erro ao guardar / Erreur lors de la sauvegarde.");
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Languages className="h-7 w-7 text-primary" />
          Idioma / Langue
        </h1>
        <p className="text-muted-foreground mt-1">
          Escolha o idioma da interface / Choisissez la langue de l'interface.
        </p>
      </div>

      <div className="grid gap-3">
        {LANGUAGES.map((lang) => (
          <Card
            key={lang.code}
            className={`cursor-pointer transition-all hover:border-primary/50 ${
              selected === lang.code ? "border-2 border-primary" : "border"
            }`}
            onClick={() => setSelected(lang.code)}
          >
            <CardContent className="flex items-center justify-between py-4 px-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{lang.flag}</span>
                <div>
                  <p className="font-medium">{lang.name}</p>
                  <p className="text-sm text-muted-foreground">{lang.description}</p>
                </div>
              </div>
              {selected === lang.code && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        onClick={handleSave}
        disabled={saving || selected === currentLocale}
        className="w-full"
      >
        {saving
          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A guardar... / Enregistrement...</>
          : "Guardar / Enregistrer"
        }
      </Button>
    </div>
  );
}