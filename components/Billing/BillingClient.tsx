"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Clock, AlertCircle } from "lucide-react";
import { submitPaymentProofAction } from "@/app/actions/billing-actions";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { ptBR, fr } from "date-fns/locale";
import { uploadPaymentProofAction } from "@/app/actions/upload-actions";
import { useTranslations, useLocale } from "next-intl";

const dateLocalesMap = { pt: ptBR, fr: fr };

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
  churchId: string;
}

export function BillingClient({ currentPlan, subscription, prices, churchName, churchId }: BillingClientProps) {
  const [selectedPlan, setSelectedPlan] = useState<"PRO" | "ENTERPRISE">("PRO");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const t = useTranslations("billing");
  const tb = useTranslations("billing.errors");
  const locale = useLocale();
  const dateLocale = dateLocalesMap[locale as keyof typeof dateLocalesMap] ?? ptBR;

  const PLAN_FEATURES = {
    FREE: t.raw("planFeatures.free") as string[],
    PRO: t.raw("planFeatures.pro") as string[],
    ENTERPRISE: t.raw("planFeatures.enterprise") as string[],
  };

  const hasPendingPayment = !!subscription?.pendingPlan;
  const wasRejected = !!subscription?.rejectedAt;

  const getPrice = (plan: "PRO" | "ENTERPRISE", cycle: BillingCycle) =>
    prices[plan][cycle].toLocaleString("pt-AO");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.type)) { toast.error(t("errorFileType")); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error(t("errorFileSize")); return; }
    setProofFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) return;
    setIsUploading(true);

    const uploadFormData = new FormData();
    uploadFormData.append("file", proofFile);
    const uploadResult = await uploadPaymentProofAction(uploadFormData);

    if (!uploadResult.success) {
      setIsUploading(false);
      toast.error(t("errorUpload"));
      return;
    }

    const formData = new FormData();
    formData.append("plan", selectedPlan);
    formData.append("billingCycle", billingCycle);
    formData.append("proofOfPayment", uploadResult.url!);

    const result = await submitPaymentProofAction(formData, churchId);
    setIsUploading(false);

    if (result.success) {
      toast.success(t("successSubmit"));
      setShowForm(false);
      setProofFile(null);
    } else {
      const errorCode = (result as any).errorCode;
      toast.error(errorCode ? tb(errorCode) : t("errorSubmit"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")} {churchName}.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("currentPlan")}</CardTitle>
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
              {subscription?.status === "ACTIVE" ? t("active") :
                subscription?.status === "TRIALING" ? t("trial") : t("inactive")}
            </Badge>
          </div>
          {subscription?.currentPeriodEnd && currentPlan !== "FREE" && (
            <p className="text-sm text-muted-foreground">
              {t("renewsOn")} {format(new Date(subscription.currentPeriodEnd), "dd 'de' MMMM 'de' yyyy", { locale: dateLocale })}
            </p>
          )}
        </CardContent>
      </Card>

      {hasPendingPayment && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="flex items-start gap-3 pt-6">
            <Clock className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-400">{t("pendingTitle")}</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-500 mt-1">
                {t("pendingDesc")} <strong>{subscription?.pendingPlan}</strong>{" "}
                ({subscription?.pendingCycle === "MONTHLY" ? t("pendingCycleMonthly") : t("pendingCycleAnnual")}){" "}
                {t("pendingVerifying")}
              </p>
              {subscription?.proofUploadedAt && (
                <p className="text-xs text-yellow-600 dark:text-yellow-600 mt-1">
                  {t("submittedAt")} {format(new Date(subscription.proofUploadedAt), "dd/MM/yyyy 'às' HH:mm")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {wasRejected && !hasPendingPayment && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">{t("rejectedTitle")}</p>
              {subscription?.rejectionReason && (
                <p className="text-sm text-destructive/80 mt-1">
                  {t("rejectedReason")}: {subscription.rejectionReason}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">{t("rejectedNewProof")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!hasPendingPayment && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t("choosePlan")}</h2>

          <div className="flex items-center gap-3">
            <RadioGroup
              value={billingCycle}
              onValueChange={(v) => setBillingCycle(v as BillingCycle)}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="MONTHLY" id="monthly" />
                <Label htmlFor="monthly">{t("monthly")}</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="ANNUAL" id="annual" />
                <Label htmlFor="annual">
                  {t("annual")}
                  <Badge variant="secondary" className="ml-2 text-xs">{t("freeMonth")}</Badge>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <Check className="h-4 w-4 text-muted-foreground shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                {currentPlan === "FREE" && <Badge className="w-full justify-center">{t("currentPlanBadge")}</Badge>}
              </CardContent>
            </Card>

            <Card className={`relative ${selectedPlan === "PRO" && showForm ? "border-2 border-primary" : ""} ${currentPlan === "PRO" ? "border-2 border-primary" : ""}`}>
              <Badge className="absolute -top-3 left-4">{t("mostPopular")}</Badge>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" /> PRO
                </CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold text-foreground">{getPrice("PRO", billingCycle)} Kz</span>
                  <span className="text-xs ml-1">/{billingCycle === "MONTHLY" ? t("perMonth") : t("perYear")}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2">
                  {PLAN_FEATURES.PRO.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                {currentPlan === "PRO" ? (
                  <Badge className="w-full justify-center">{t("currentPlanBadge")}</Badge>
                ) : (
                  <Button className="w-full" onClick={() => { setSelectedPlan("PRO"); setShowForm(true); }} disabled={currentPlan === "ENTERPRISE"}>
                    {currentPlan === "ENTERPRISE" ? t("downgradeUnavailable") : t("upgradePro")}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className={`${selectedPlan === "ENTERPRISE" && showForm ? "border-2 border-amber-500" : ""} ${currentPlan === "ENTERPRISE" ? "border-2 border-amber-500" : ""}`}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" /> ENTERPRISE
                </CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold text-foreground">{getPrice("ENTERPRISE", billingCycle)} Kz</span>
                  <span className="text-xs ml-1">/{billingCycle === "MONTHLY" ? t("perMonth") : t("perYear")}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2">
                  {PLAN_FEATURES.ENTERPRISE.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-amber-500 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                {currentPlan === "ENTERPRISE" ? (
                  <Badge className="w-full justify-center bg-amber-500">{t("currentPlanBadge")}</Badge>
                ) : (
                  <Button variant="outline" className="w-full border-amber-500 text-amber-600 hover:bg-amber-50" onClick={() => { setSelectedPlan("ENTERPRISE"); setShowForm(true); }}>
                    {t("upgradeEnterprise")}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {showForm && !hasPendingPayment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("submitProof")}</CardTitle>
            <CardDescription>
              {t("submitProofDesc")} <strong>{getPrice(selectedPlan, billingCycle)} Kz</strong> {t("submitProofDesc2")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              <p className="font-medium">{t("bankDetails")}:</p>
              <p>{t("bank")}: <strong>BFA</strong></p>
              <p>{t("iban")}: <strong>AO06 0006 0000 0000 0000 0000 0</strong></p>
              <p>{t("holder")}: <strong>ChurchOS, Lda</strong></p>
              <p>{t("reference")}: <strong>{churchName.toUpperCase().replace(/\s/g, "-")}</strong></p>
              <p>{t("amount")}: <strong>{getPrice(selectedPlan, billingCycle)} Kz</strong></p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="proofFile">{t("proofLabel")}</Label>
                <Input id="proofFile" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="cursor-pointer" />
                {proofFile && (
                  <p className="text-xs text-muted-foreground">
                    {t("fileSelected")}: <strong>{proofFile.name}</strong> ({(proofFile.size / 1024).toFixed(0)} KB)
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{t("formatsAccepted")}</p>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isUploading || !proofFile}>
                  {isUploading ? t("uploading") : t("submit")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}