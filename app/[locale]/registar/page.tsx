"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Church, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { registerChurchAction } from "@/app/actions/register";
import { toast } from "sonner";

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
  const [timezone, setTimezone] = useState("Africa/Luanda");

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  const handleChurchNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = generateSlug(e.target.value);
    setSlugPreview(slug);
    const slugInput = document.getElementById("churchSlug") as HTMLInputElement;
    if (slugInput) slugInput.value = slug;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    const formData = new FormData(e.currentTarget);
    formData.set("timezone", timezone); // 👈 adiciona timezone ao formData

    startTransition(async () => {
      const result = await registerChurchAction(formData);

      if (result.success) {
        toast.success("Igreja registada com sucesso!");
        router.push(`/login?registered=true`);
      } else if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
        toast.error("Verifique os erros no formulário.");
      } else {
        toast.error(result.error || "Erro ao registar.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">

        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Church className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Registar Igreja</h1>
          <p className="text-sm text-muted-foreground">
            Crie a conta da sua igreja em menos de 2 minutos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-8 shadow-sm space-y-6">

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Dados da Igreja
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="churchName">
                Nome da Igreja
              </label>
              <Input
                id="churchName"
                name="churchName"
                placeholder="Ex: Igreja Central Luanda"
                onChange={handleChurchNameChange}
                className={fieldErrors.churchName ? "border-destructive" : ""}
              />
              {fieldErrors.churchName && (
                <p className="text-xs text-destructive">{fieldErrors.churchName[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="churchSlug">
                Endereço no sistema
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  churchos.com/
                </span>
                <Input
                  id="churchSlug"
                  name="churchSlug"
                  placeholder="igreja-central-luanda"
                  value={slugPreview}
                  onChange={(e) => setSlugPreview(e.target.value)}
                  className={fieldErrors.churchSlug ? "border-destructive" : ""}
                />
              </div>
              {fieldErrors.churchSlug ? (
                <p className="text-xs text-destructive">{fieldErrors.churchSlug[0]}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Apenas letras minúsculas, números e hífens
                </p>
              )}
            </div>

            {/* 👈 NOVO — Fuso Horário */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Fuso Horário
              </label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className={fieldErrors.timezone ? "border-destructive" : ""}>
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
              {fieldErrors.timezone ? (
                <p className="text-xs text-destructive">{fieldErrors.timezone[0]}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Define como as datas e horas serão exibidas
                </p>
              )}
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Conta do Administrador
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="adminName">
                Nome completo
              </label>
              <Input
                id="adminName"
                name="adminName"
                placeholder="Pastor João Silva"
                className={fieldErrors.adminName ? "border-destructive" : ""}
              />
              {fieldErrors.adminName && (
                <p className="text-xs text-destructive">{fieldErrors.adminName[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="adminEmail">
                E-mail
              </label>
              <Input
                id="adminEmail"
                name="adminEmail"
                type="email"
                placeholder="pastor@igreja.com"
                className={fieldErrors.adminEmail ? "border-destructive" : ""}
              />
              {fieldErrors.adminEmail && (
                <p className="text-xs text-destructive">{fieldErrors.adminEmail[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="adminPassword">
                Palavra-passe
              </label>
              <Input
                id="adminPassword"
                name="adminPassword"
                type="password"
                placeholder="Mínimo 6 caracteres"
                className={fieldErrors.adminPassword ? "border-destructive" : ""}
              />
              {fieldErrors.adminPassword && (
                <p className="text-xs text-destructive">{fieldErrors.adminPassword[0]}</p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A criar conta...
              </>
            ) : (
              "Criar Conta Gratuitamente"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}