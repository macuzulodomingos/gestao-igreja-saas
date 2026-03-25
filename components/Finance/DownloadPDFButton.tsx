"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { FinanceReport } from "./FinanceReport";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

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
  canExportPdf: boolean; // 👈 NOVO
}

export function DownloadPDFButton({
  churchName,
  month,
  year,
  income,
  expenses,
  stats,  canExportPdf,
}: DownloadPDFButtonProps) {
  const monthName = MONTHS[month - 1];
  const fileName = `relatorio-financeiro-${monthName.toLowerCase()}-${year}.pdf`;

  // 👈 plano FREE — mostra botão bloqueado com tooltip
  if (!canExportPdf) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" className="gap-2" disabled>
              <Lock className="h-4 w-4" />
              Exportar PDF
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Disponível no plano PRO. Actualize o seu plano.</p>
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
              A gerar PDF...
            </>
          ) : (
            <>
              <FileDown className="h-4 w-4" />
              Exportar PDF
            </>
          )}
        </Button>
      )}
    </PDFDownloadLink>
  );
}