"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { submitPaymentProofAction } from "@/app/actions/billing-actions";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { supabaseClient } from "@/lib/supabase-client";

const PLAN_FEATURES = {
  FREE: ["Até 50 membros", "1 utilizador", "3 departamentos", "10 eventos/mês", "50 transacções/mês"],
  PRO: ["Até 500 membros", "5 utilizadores", "Departamentos ilimitados", "Eventos ilimitados", "Transacções ilimitadas", "Exportação PDF"],
  ENTERPRISE: ["Membros ilimitados", "Utilizadores ilimitados", "Tudo do PRO", "Suporte prioritário", "Acesso à API"],
};

type Plan = "FREE" | "PRO" | "ENTERPRISE";
type BillingCycle = "MONTHLY" | "ANNUAL";

interface Subscription {
  status: string;
  plan: Plan;
  billingCycle: BillingCycle;
  currentPeriodEnd: Date | string | null;
  pendingPlan: Plan | null;
  pendingCycle: BillingCycle | null;
  proofOfPayment: string | null;
  proofUploadedAt: Date | string | null;
  confirmedAt: Date | string | null;
  rejectedAt: Date | string | null;
  rejectionReason: string | null;
}

interface BillingClientProps {
  currentPlan: Plan;
  subscription: Subscription | null;
  prices: { PRO: { MONTHLY: number; ANNUAL: number }; ENTERPRISE: { MONTHLY: number; ANNUAL: number } };
  churchName: string;
}

export function BillingClient({ currentPlan, subscription, prices, churchName }: BillingClientProps) {
  const [selectedPlan, setSelectedPlan] = useState<"PRO" | "ENTERPRISE">("PRO");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const hasPendingPayment = !!subscription?.pendingPlan;
  const wasRejected = !!subscription?.rejectedAt;

  const getPrice = (plan: "PRO" | "ENTERPRISE", cycle: BillingCycle) => {
    return prices[plan][cycle].toLocaleString("pt-AO");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Valida tipo — só PDF e imagens
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.type)) {
      toast.error("Apenas PDF, JPG ou PNG são aceites.");
      return;
    }

    // Valida tamanho — máximo 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("O ficheiro não pode ter mais de 5MB.");
      return;
    }

    setProofFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) return;

    setIsUploading(true);

    // 👈 Upload directo para Supabase Storage
    const fileExt = proofFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { data, error } = await supabaseClient.storage
      .from("payment-proofs")
      .upload(fileName, proofFile, {
        contentType: proofFile.type,
        cacheControl: "3600",
      });

    if (error) {
      setIsUploading(false);
      toast.error("Erro ao fazer upload do comprovativo.");
      return;
    }

    // 👈 Gera URL assinada válida por 7 dias para o SUPER_ADMIN ver
    const { data: signedUrl } = await supabaseClient.storage
      .from("payment-proofs")
      .createSignedUrl(data.path, 60 * 60 * 24 * 7); // 7 dias

    const formData = new FormData();
    formData.append("plan", selectedPlan);
    formData.append("billingCycle", billingCycle);
    formData.append("proofOfPayment", signedUrl?.signedUrl ?? data.path);

    const result = await submitPaymentProofAction(formData);
    setIsUploading(false);

    if (result.success) {
      toast.success("Comprovativo submetido! Aguarde a confirmação.");
      setShowForm(false);
      setProofFile(null);
    } else {
      toast.error(result.error || "Erro ao submeter.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Faturamento</h1>
        <p className="text-muted-foreground">
          Gerencie o plano e pagamentos de {churchName}.
        </p>
      </div>

      {/* Plano actual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plano Actual</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentPlan === "FREE" && <span className="text-2xl font-bold">FREE</span>}
            {currentPlan === "PRO" && (
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold text-primary">PRO</span>
              </div>
            )}
            {currentPlan === "ENTERPRISE" && (
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <span className="text-2xl font-bold text-amber-500">ENTERPRISE</span>
              </div>
            )}
            <Badge variant={subscription?.status === "ACTIVE" ? "default" : "secondary"}>
              {subscription?.status === "ACTIVE" ? "Activo" :
                subscription?.status === "TRIALING" ? "Trial" : "Inactivo"}
            </Badge>
          </div>
          {subscription?.currentPeriodEnd && currentPlan !== "FREE" && (
            <p className="text-sm text-muted-foreground">
              Renova em {format(new Date(subscription.currentPeriodEnd), "dd 'de' MMMM 'de' yyyy", { locale: pt })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pagamento pendente */}
      {hasPendingPayment && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="flex items-start gap-3 pt-6">
            <Clock className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-400">
                Pagamento em análise
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-500 mt-1">
                O teu pedido de upgrade para <strong>{subscription?.pendingPlan}</strong> ({subscription?.pendingCycle === "MONTHLY" ? "Mensal" : "Anual"}) está a ser verificado.
                Receberás uma confirmação em breve.
              </p>
              {subscription?.proofUploadedAt && (
                <p className="text-xs text-yellow-600 dark:text-yellow-600 mt-1">
                  Submetido em {format(new Date(subscription.proofUploadedAt), "dd/MM/yyyy 'às' HH:mm")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagamento rejeitado */}
      {wasRejected && !hasPendingPayment && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Pagamento rejeitado</p>
              {subscription?.rejectionReason && (
                <p className="text-sm text-destructive/80 mt-1">
                  Motivo: {subscription.rejectionReason}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Por favor submete um novo comprovativo.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Planos disponíveis */}
      {!hasPendingPayment && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Escolhe o teu plano</h2>

          {/* Toggle mensal/anual */}
          <div className="flex items-center gap-3">
            <RadioGroup
              value={billingCycle}
              onValueChange={(v) => setBillingCycle(v as BillingCycle)}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="MONTHLY" id="monthly" />
                <Label htmlFor="monthly">Mensal</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="ANNUAL" id="annual" />
                <Label htmlFor="annual">
                  Anual
                  <Badge variant="secondary" className="ml-2 text-xs">1 mês grátis</Badge>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* FREE */}
            <Card className={currentPlan === "FREE" ? "border-2 border-primary" : ""}>
              <CardHeader>
                <CardTitle className="text-base">FREE</CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold text-foreground">0 Kz</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2">
                  {PLAN_FEATURES.FREE.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-muted-foreground shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {currentPlan === "FREE" && (
                  <Badge className="w-full justify-center">Plano actual</Badge>
                )}
              </CardContent>
            </Card>

            {/* PRO */}
            <Card className={`relative ${selectedPlan === "PRO" && showForm ? "border-2 border-primary" : ""} ${currentPlan === "PRO" ? "border-2 border-primary" : ""}`}>
              <Badge className="absolute -top-3 left-4">Mais popular</Badge>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" /> PRO
                </CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold text-foreground">
                    {getPrice("PRO", billingCycle)} Kz
                  </span>
                  <span className="text-xs ml-1">/{billingCycle === "MONTHLY" ? "mês" : "ano"}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2">
                  {PLAN_FEATURES.PRO.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {currentPlan === "PRO" ? (
                  <Badge className="w-full justify-center">Plano actual</Badge>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => { setSelectedPlan("PRO"); setShowForm(true); }}
                    disabled={currentPlan === "ENTERPRISE"}
                  >
                    {currentPlan === "ENTERPRISE" ? "Downgrade indisponível" : "Upgrade para PRO"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* ENTERPRISE */}
            <Card className={`${selectedPlan === "ENTERPRISE" && showForm ? "border-2 border-amber-500" : ""} ${currentPlan === "ENTERPRISE" ? "border-2 border-amber-500" : ""}`}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" /> ENTERPRISE
                </CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold text-foreground">
                    {getPrice("ENTERPRISE", billingCycle)} Kz
                  </span>
                  <span className="text-xs ml-1">/{billingCycle === "MONTHLY" ? "mês" : "ano"}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2">
                  {PLAN_FEATURES.ENTERPRISE.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-amber-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {currentPlan === "ENTERPRISE" ? (
                  <Badge className="w-full justify-center bg-amber-500">Plano actual</Badge>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-amber-500 text-amber-600 hover:bg-amber-50"
                    onClick={() => { setSelectedPlan("ENTERPRISE"); setShowForm(true); }}
                  >
                    Upgrade para ENTERPRISE
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Formulário de comprovativo */}
      {showForm && !hasPendingPayment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submeter comprovativo</CardTitle>
            <CardDescription>
              Transfere o valor de <strong>{getPrice(selectedPlan, billingCycle)} Kz</strong> para a nossa conta e submete o comprovativo abaixo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dados bancários */}
            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              <p className="font-medium">Dados para transferência:</p>
              <p>Banco: <strong>BFA</strong></p>
              <p>IBAN: <strong>AO06 0006 0000 0000 0000 0000 0</strong></p>
              <p>Titular: <strong>ChurchOS, Lda</strong></p>
              <p>Referência: <strong>{churchName.toUpperCase().replace(/\s/g, "-")}</strong></p>
              <p>Valor: <strong>{getPrice(selectedPlan, billingCycle)} Kz</strong></p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="proofFile">
                  Comprovativo de pagamento
                </Label>
                <Input
                  id="proofFile"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {proofFile && (
                  <p className="text-xs text-muted-foreground">
                    Ficheiro seleccionado: <strong>{proofFile.name}</strong> ({(proofFile.size / 1024).toFixed(0)} KB)
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Formatos aceites: PDF, JPG, PNG. Máximo 5MB.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isUploading || !proofFile}
                >
                  {isUploading ? "A fazer upload..." : "Submeter comprovativo"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}