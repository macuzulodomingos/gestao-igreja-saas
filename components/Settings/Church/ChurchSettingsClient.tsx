"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateChurchTimezoneAction } from "@/app/actions/church-actions";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const TIMEZONES = [
  { label: "🇦🇴 Angola (UTC+1)", value: "Africa/Luanda" },
  { label: "🇨🇩 Congo - Kinshasa (UTC+1)", value: "Africa/Kinshasa" },
  { label: "🇨🇩 Congo - Lubumbashi (UTC+2)", value: "Africa/Lubumbashi" },
  { label: "🇧🇷 Brasil - São Paulo (UTC-3)", value: "America/Sao_Paulo" },
  { label: "🇧🇷 Brasil - Manaus (UTC-4)", value: "America/Manaus" },
  { label: "🇵🇹 Portugal (UTC+0)", value: "Europe/Lisbon" },
  { label: "🇲🇿 Moçambique (UTC+2)", value: "Africa/Maputo" },
];

interface Church {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  plan: string;
}

interface ChurchSettingsClientProps {
  church: Church;
}

export default function ChurchSettingsClient({ church }: ChurchSettingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [timezone, setTimezone] = useState(church.timezone);

  const handleSave = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("timezone", timezone);

      const result = await updateChurchTimezoneAction(formData);

      if (result.success) {
        toast.success("Configurações actualizadas!");
      } else {
        toast.error(result.error || "Erro ao actualizar.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Globe className="h-7 w-7 text-primary" />
          Configurações da Igreja
        </h1>
        <p className="text-muted-foreground mt-1">
          Gere as configurações gerais da sua igreja.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Nome</span>
            <span className="text-sm font-medium">{church.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Slug</span>
            <span className="text-sm font-medium">{church.slug}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Plano</span>
            <Badge variant="secondary">{church.plan}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fuso Horário</CardTitle>
          <CardDescription>
            Define o fuso horário da sua igreja. Afecta a exibição de datas e horas nos eventos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o fuso horário" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map(tz => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleSave}
            disabled={isPending || timezone === church.timezone}
            className="w-full"
          >
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A guardar...</>
            ) : (
              "Guardar Alterações"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}