"use client";

import { formatCurrency } from "@/lib/format";
import {
  Document, Page, Text, View, StyleSheet,
} from "@react-pdf/renderer";
import { parseISO, isValid } from "date-fns";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingHorizontal: 40,
    paddingBottom: 60, // 👈 reserva espaço para o rodapé (30px posição + 30px margem)
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 24,
    borderBottom: "2px solid #7c3aed",
    paddingBottom: 12,
  },
  churchName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#7c3aed",
  },
  reportTitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  reportDate: {
    fontSize: 9,
    color: "#999",
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    border: "1px solid #e5e7eb",
  },
  summaryLabel: {
    fontSize: 9,
    color: "#666",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  incomeValue: { color: "#059669" },
  expenseValue: { color: "#dc2626" },
  balancePositive: { color: "#059669" },
  balanceNegative: { color: "#dc2626" },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: "#374151",
    paddingBottom: 4,
    borderBottom: "1px solid #e5e7eb",
  },
  section: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottom: "1px solid #f3f4f6",
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottom: "1px solid #f3f4f6",
    backgroundColor: "#fafafa",
  },
  colDate: { width: "15%", fontSize: 9, color: "#666" },
  colDescription: { width: "40%", fontSize: 9 },
  colCategory: { width: "25%", fontSize: 9, color: "#666" },
  colAmount: { width: "20%", fontSize: 9, textAlign: "right" },
  colAmountHeader: { width: "20%", fontSize: 9, textAlign: "right", fontFamily: "Helvetica-Bold" },
  colHeader: { fontFamily: "Helvetica-Bold", fontSize: 9, color: "#374151" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "1px solid #e5e7eb",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: "#999",
  },
  emptyText: {
    fontSize: 9,
    color: "#999",
    fontStyle: "italic",
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
});


const formatDate = (date: Date | string) => {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "—";
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
};


type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: Date | string;
};

// 👈 tipo para as traduções
type ReportTranslations = {
  title: string;
  generatedAt: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  monthlyBalance: string;
  generalBalance: string;
  incomeSection: string;
  expensesSection: string;
  total: string;
  noIncome: string;
  noExpenses: string;
  date: string;
  description: string;
  category: string;
  amount: string;
  footer: string;
  confidential: string;
};

interface FinanceReportProps {
  churchName: string;
  month: number;
  year: number;
  monthName: string; // 👈 passa o nome do mês já traduzido
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
  translations: ReportTranslations; // 👈 NOVO
}

export function FinanceReport({
  churchName,
  month,
  year,
  monthName,
  income,
  expenses,
  stats,
  translations: tr,
}: FinanceReportProps) {
  const generatedAt = new Date().toLocaleString("pt-AO");

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.churchName}>{churchName}</Text>
          <Text style={styles.reportTitle}>
            {tr.title} — {monthName} {year}
          </Text>
          <Text style={styles.reportDate}>
            {tr.generatedAt}: {generatedAt}
          </Text>
        </View>

        {/* Cards de resumo */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{tr.monthlyIncome}</Text>
            <Text style={[styles.summaryValue, styles.incomeValue]}>
              {formatCurrency(stats.monthlyIncomes)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{tr.monthlyExpenses}</Text>
            <Text style={[styles.summaryValue, styles.expenseValue]}>
              {formatCurrency(stats.monthlyExpenses)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{tr.monthlyBalance}</Text>
            <Text style={[
              styles.summaryValue,
              stats.monthlyBalance >= 0 ? styles.balancePositive : styles.balanceNegative
            ]}>
              {formatCurrency(stats.monthlyBalance)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{tr.generalBalance}</Text>
            <Text style={[
              styles.summaryValue,
              stats.netBalance >= 0 ? styles.balancePositive : styles.balanceNegative
            ]}>
              {formatCurrency(stats.netBalance)}
            </Text>
          </View>
        </View>

        {/* Tabela de Receitas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {tr.incomeSection} ({income.length}) — {tr.total}: {formatCurrency(stats.monthlyIncomes)}
          </Text>
          {income.length === 0 ? (
            <Text style={styles.emptyText}>{tr.noIncome}</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.colDate, styles.colHeader]}>{tr.date}</Text>
                <Text style={[styles.colDescription, styles.colHeader]}>{tr.description}</Text>
                <Text style={[styles.colCategory, styles.colHeader]}>{tr.category}</Text>
                <Text style={[styles.colAmountHeader]}>{tr.amount}</Text>
              </View>
              {income.map((t, i) => (
                <View key={t.id} wrap={false} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={styles.colDate}>{formatDate(t.date)}</Text>
                  <Text style={styles.colDescription}>{t.description}</Text>
                  <Text style={styles.colCategory}>{t.category}</Text>
                  <Text style={[styles.colAmount, { color: "#059669" }]}>
                    {formatCurrency(t.amount)}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Tabela de Despesas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {tr.expensesSection} ({expenses.length}) — {tr.total}: {formatCurrency(stats.monthlyExpenses)}
          </Text>
          {expenses.length === 0 ? (
            <Text style={styles.emptyText}>{tr.noExpenses}</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.colDate, styles.colHeader]}>{tr.date}</Text>
                <Text style={[styles.colDescription, styles.colHeader]}>{tr.description}</Text>
                <Text style={[styles.colCategory, styles.colHeader]}>{tr.category}</Text>
                <Text style={[styles.colAmountHeader]}>{tr.amount}</Text>
              </View>
              {expenses.map((t, i) => (
                <View key={t.id} wrap={false} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={styles.colDate}>{formatDate(t.date)}</Text>
                  <Text style={styles.colDescription}>{t.description}</Text>
                  <Text style={styles.colCategory}>{t.category}</Text>
                  <Text style={[styles.colAmount, { color: "#dc2626" }]}>
                    {formatCurrency(t.amount)}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Rodapé */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{tr.footer}</Text>
          <Text style={styles.footerText}>
            {monthName} {year} — {tr.confidential}
          </Text>
        </View>

      </Page>
    </Document>
  );
}