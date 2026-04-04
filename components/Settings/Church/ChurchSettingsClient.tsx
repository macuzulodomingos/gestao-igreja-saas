"use client";

import { useTransition, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateChurchSettingsAction } from "@/app/actions/church-actions";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

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
  const [name, setName] = useState(church.name);
  const t = useTranslations("churchSettings");
  const te = useTranslations("churchSettings.errors");
  const tv = useTranslations("validation");

  const hasChanges = name !== church.name || timezone !== church.timezone;

  const handleSave = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("timezone", timezone);

      const result = await updateChurchSettingsAction(formData);

      if (result.success) {
        toast.success(t("successSaved"));
      } else if (result.fieldErrors) {
        // mostra o primeiro erro de campo
        const firstError = Object.values(result.fieldErrors)[0]?.[0];
        if (firstError) {
          let msg = firstError;
          if (firstError.startsWith("validation.")) {
            try { msg = tv(firstError.replace("validation.", "") as any); } catch { }
          }
          toast.error(msg);
        }
      } else {
        const errorCode = (result as any).errorCode;
        toast.error(errorCode ? te(errorCode) : t("errorSave"));
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Globe className="h-7 w-7 text-primary" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("generalInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* 👈 nome editável */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t("nameLabel")}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              maxLength={100}
            />
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <span className="text-sm text-muted-foreground">{t("slug")}</span>
            <span className="text-sm font-medium text-muted-foreground">{church.slug}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <span className="text-sm text-muted-foreground">{t("plan")}</span>
            <Badge variant="secondary">{church.plan}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("timezone")}</CardTitle>
          <CardDescription>{t("timezoneDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger>
              <SelectValue placeholder={t("timezonePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map(tz => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={isPending || !hasChanges || name.trim().length < 2}
        className="w-full"
      >
        {isPending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("saving")}</>
        ) : (
          t("save")
        )}
      </Button>
    </div>
  );
}