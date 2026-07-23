"use client";

import { useState, useTransition } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { Church, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { registerChurchAction } from "@/app/actions/register";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import Image from "next/image";

const TIMEZONES = [
  { label: "🇦🇴 Angola (UTC+1)", value: "Africa/Luanda" },
  { label: "🇧🇷 Brasil - São Paulo (UTC-3)", value: "America/Sao_Paulo" },
  { label: "🇧🇷 Brasil - Manaus (UTC-4)", value: "America/Manaus" },
  { label: "🇵🇹 Portugal (UTC+0)", value: "Europe/Lisbon" },
  { label: "🇲🇿 Moçambique (UTC+2)", value: "Africa/Maputo" },
  { label: "🇨🇩 Congo - Kinshasa (UTC+1)", value: "Africa/Kinshasa" },
  { label: "🇨🇩 Congo - Lubumbashi (UTC+2)", value: "Africa/Lubumbashi" },
];

export default function RegistarPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [slugPreview, setSlugPreview] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [timezone, setTimezone] = useState("Africa/Luanda");
  const [locale, setLocale] = useState<"pt" | "fr">("pt");
  const t = useTranslations("register");
  const tv = useTranslations("validation");

  const translateError = (msg: string) => {
    const validationKeys: Record<string, string> = {
      nameRequired: tv("nameRequired"),
      nameTooLong: tv("nameTooLong"),
      emailInvalid: tv("emailInvalid"),
      passwordTooShort: tv("passwordTooShort"),
      passwordUppercase: tv("passwordUppercase"),
      passwordNumber: tv("passwordNumber"),
      required: tv("required"),
    };
    const registerKeys: Record<string, string> = {
      slugTaken: t("slugTaken"),
      emailTaken: t("emailTaken"),
      slugHint: t("slugHint"),
      errorCreate: t("errorCreate"),
    };

    if (msg.startsWith("validation.")) {
      const key = msg.replace("validation.", "");
      return validationKeys[key] ?? tv("required");
    }
    if (msg.startsWith("register.")) {
      const key = msg.replace("register.", "");
      return registerKeys[key] ?? t("errorCreate");
    }
    return msg;
  };

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  const handleChurchNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!slugManuallyEdited) {
      setSlugPreview(generateSlug(e.target.value));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true);
    setSlugPreview(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    const formData = new FormData(e.currentTarget);
    formData.set("timezone", timezone);
    formData.set("locale", locale);

    startTransition(async () => {
      try {
        const result = await registerChurchAction(formData);

        if (result.success) {
          toast.success(t("successCreated"));
          router.push(`/login?registered=true`);
        } else if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
          toast.error(t("errorForm"));
        } else if (result.errorCode) {
          toast.error(translateError(`register.${result.errorCode}`));
        } else {
          toast.error(t("errorCreate"));
        }
      } catch (error) {
        console.error("[REGISTER_CHURCH_ERROR]:", error);
        toast.error(t("errorCreate"));
      }
    });
  };

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">

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
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-8 shadow-sm space-y-6">

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t("churchData")}
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="churchName">
                {t("churchName")}
              </label>
              <Input
                id="churchName"
                name="churchName"
                placeholder={t("churchNamePlaceholder")}
                onChange={handleChurchNameChange}
                className={fieldErrors.churchName ? "border-destructive" : ""}
              />
              {fieldErrors.churchName && (
                <p className="text-xs text-destructive">
                  {translateError(fieldErrors.churchName[0])}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="churchSlug">
                {t("churchSlug")}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {t("churchSlugPrefix")}
                </span>
                <Input
                  id="churchSlug"
                  name="churchSlug"
                  placeholder={t("churchSlugPlaceholder")}
                  value={slugPreview}
                  onChange={handleSlugChange}
                  className={fieldErrors.churchSlug ? "border-destructive" : ""}
                />
              </div>
              {fieldErrors.churchSlug ? (
                <p className="text-xs text-destructive">
                  {translateError(fieldErrors.churchSlug[0])}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">{t("churchSlugHint")}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("timezone")}</label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className={fieldErrors.timezone ? "border-destructive" : ""}>
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
              {fieldErrors.timezone ? (
                <p className="text-xs text-destructive">
                  {translateError(fieldErrors.timezone[0])}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">{t("timezoneHint")}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("interfaceLanguage")}</label>
              <Select value={locale} onValueChange={(v) => setLocale(v as "pt" | "fr")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">🇦🇴 Português</SelectItem>
                  <SelectItem value="fr">🇨🇩 Français</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t("interfaceLanguageHint")}</p>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t("adminData")}
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="adminName">
                {t("adminName")}
              </label>
              <Input
                id="adminName"
                name="adminName"
                placeholder={t("adminNamePlaceholder")}
                className={fieldErrors.adminName ? "border-destructive" : ""}
              />
              {fieldErrors.adminName && (
                <p className="text-xs text-destructive">
                  {translateError(fieldErrors.adminName[0])}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="adminEmail">
                {t("adminEmail")}
              </label>
              <Input
                id="adminEmail"
                name="adminEmail"
                type="email"
                placeholder={t("adminEmailPlaceholder")}
                className={fieldErrors.adminEmail ? "border-destructive" : ""}
              />
              {fieldErrors.adminEmail && (
                <p className="text-xs text-destructive">
                  {translateError(fieldErrors.adminEmail[0])}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="adminPassword">
                {t("adminPassword")}
              </label>
              <Input
                id="adminPassword"
                name="adminPassword"
                type="password"
                placeholder={t("adminPasswordPlaceholder")}
                className={fieldErrors.adminPassword ? "border-destructive" : ""}
              />
              {fieldErrors.adminPassword && (
                <p className="text-xs text-destructive">
                  {translateError(fieldErrors.adminPassword[0])}
                </p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("submitting")}
              </>
            ) : (
              t("submit")
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("hasAccount")}{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              {t("login")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}