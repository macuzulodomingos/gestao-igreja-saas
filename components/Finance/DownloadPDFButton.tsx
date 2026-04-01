"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { FinanceReport } from "./FinanceReport";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip";
import { useTranslations, useLocale } from "next-intl";

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const monthsMap = {
  pt: MONTHS_PT,
  fr: MONTHS_FR,
};

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
  const locale = useLocale();
  const months = monthsMap[locale as keyof typeof monthsMap] ?? MONTHS_PT;
  const monthName = months[month - 1];
  const fileName = `${t("fileName")}-${monthName.toLowerCase()}-${year}.pdf`;

  if (!canExportPdf) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" className="gap-2" disabled>
              <Lock className="h-4 w-4" />
              {t("export")}
            </Button>
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
          income={income}
          expenses={expenses}
          stats={stats}
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