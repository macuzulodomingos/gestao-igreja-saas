"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, DollarSign } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

interface FinanceSummaryProps {
  stats: {
    totalIncomes: number;
    totalExpenses: number;
    netBalance: number;
    monthlyIncomes: number;
    monthlyExpenses: number;
    monthlyBalance: number;
  };
  month: number;
  year: number;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 2,
  }).format(amount).replace("AOA", "Kz").replace(/\s+/g, " ").trim();

const dateLocalesMap = {
  pt: "pt-AO",
  fr: "fr-FR",
};

export function FinanceSummary({ stats, month, year }: FinanceSummaryProps) {
  const t = useTranslations("finance.summary");
  const locale = useLocale();
  const dateLocale = dateLocalesMap[locale as keyof typeof dateLocalesMap] ?? "pt-AO";

  const monthName = new Date(year, month - 1, 1)
    .toLocaleString(dateLocale, { month: "long" });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("monthlyIncome")} {capitalizedMonth}
          </CardTitle>
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-emerald-600">
            {formatCurrency(stats.monthlyIncomes)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{t("totalThisMonth")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("monthlyExpenses")} {capitalizedMonth}
          </CardTitle>
          <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
            <TrendingDown className="h-4 w-4 text-red-600" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(stats.monthlyExpenses)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{t("totalThisMonth")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("monthlyBalance")} {capitalizedMonth}
          </CardTitle>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${stats.monthlyBalance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {formatCurrency(stats.monthlyBalance)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{t("incomeMinusExpenses")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("generalBalance")}
          </CardTitle>
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${stats.netBalance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {formatCurrency(stats.netBalance)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{t("totalBalance")}</p>
        </CardContent>
      </Card>
    </div>
  );
}