"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { FinanceReport } from "./FinanceReport";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslations, useLocale } from "next-intl";
import { getMonthNames } from "@/lib/date";



type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: Date | string;
};

interface DownloadPDFButtonProps {
  churchName: string;
  month: number;
  year: number;
  income: Transaction[];
  expenses: Transaction[];
  stats: {
    monthlyIncomes: number;
    monthlyExpenses: number;
    monthlyBalance: number;
    totalIncomes: number;
    totalExpenses: number;
    netBalance: number;
  };
  canExportPdf: boolean;
}

export function DownloadPDFButton({
  churchName,
  month,
  year,
  income,
  expenses,
  stats,
  canExportPdf,
}: DownloadPDFButtonProps) {
  const t = useTranslations("finance.pdf");
  const tr = useTranslations("finance.report");
  const locale = useLocale();
  const months = getMonthNames(locale);
  const monthName = months[month - 1] ?? months[0];
  const fileName = `${t("fileName")}-${monthName.toLowerCase()}-${year}.pdf`;

  if (!canExportPdf) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="inline-block">
              <Button variant="outline" className="gap-2 pointer-events-none" disabled>
                <Lock className="h-4 w-4" />
                {t("export")}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("locked")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <PDFDownloadLink
      document={
        <FinanceReport
          churchName={churchName}
          month={month}
          year={year}
          monthName={monthName}        // 👈 NOVO
          income={income}
          expenses={expenses}
          stats={stats}
          translations={{              // 👈 NOVO
            title: tr("title"),
            generatedAt: tr("generatedAt"),
            monthlyIncome: tr("monthlyIncome"),
            monthlyExpenses: tr("monthlyExpenses"),
            monthlyBalance: tr("monthlyBalance"),
            generalBalance: tr("generalBalance"),
            incomeSection: tr("incomeSection"),
            expensesSection: tr("expensesSection"),
            total: tr("total"),
            noIncome: tr("noIncome"),
            noExpenses: tr("noExpenses"),
            date: tr("date"),
            description: tr("description"),
            category: tr("category"),
            amount: tr("amount"),
            footer: tr("footer"),
            confidential: tr("confidential"),
          }}
        />
      }
      fileName={fileName}
    >
      {({ loading }) => (
        <Button variant="outline" className="gap-2" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("generating")}
            </>
          ) : (
            <>
              <FileDown className="h-4 w-4" />
              {t("export")}
            </>
          )}
        </Button>
      )}
    </PDFDownloadLink>
  );
}