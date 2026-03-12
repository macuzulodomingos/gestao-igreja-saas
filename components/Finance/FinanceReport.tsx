"use client";

import {
  Document, Page, Text, View, StyleSheet, Font
} from "@react-pdf/renderer";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  // Cabeçalho
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
  // Cards de resumo
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
  // Secções
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
  // Tabela
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: "6 8",
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    padding: "5 8",
    borderBottom: "1px solid #f3f4f6",
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: "5 8",
    borderBottom: "1px solid #f3f4f6",
    backgroundColor: "#fafafa",
  },
  colDate: { width: "15%", fontSize: 9, color: "#666" },
  colDescription: { width: "40%", fontSize: 9 },
  colCategory: { width: "25%", fontSize: 9, color: "#666" },
  colAmount: { width: "20%", fontSize: 9, textAlign: "right" },
  colAmountHeader: { width: "20%", fontSize: 9, textAlign: "right", fontFamily: "Helvetica-Bold" },
  colHeader: { fontFamily: "Helvetica-Bold", fontSize: 9, color: "#374151" },
  // Rodapé
  footer: {
    position: "absolute",
    bottom: 30,
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
    padding: "8 0",
  },
});

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 2,
  }).format(amount).replace("AOA", "Kz");

const formatDate = (date: Date | string) => {
  const d = new Date(date);
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

interface FinanceReportProps {
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
}

export function FinanceReport({
  churchName,
  month,
  year,
  income,
  expenses,
  stats,
}: FinanceReportProps) {
  const monthName = MONTHS[month - 1];
  const generatedAt = new Date().toLocaleString("pt-BR");

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.churchName}>{churchName}</Text>
          <Text style={styles.reportTitle}>
            Relatório Financeiro — {monthName} {year}
          </Text>
          <Text style={styles.reportDate}>
            Gerado em: {generatedAt}
          </Text>
        </View>

        {/* Cards de resumo */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Receitas do Mês</Text>
            <Text style={[styles.summaryValue, styles.incomeValue]}>
              {formatCurrency(stats.monthlyIncomes)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Despesas do Mês</Text>
            <Text style={[styles.summaryValue, styles.expenseValue]}>
              {formatCurrency(stats.monthlyExpenses)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Saldo do Mês</Text>
            <Text style={[
              styles.summaryValue,
              stats.monthlyBalance >= 0 ? styles.balancePositive : styles.balanceNegative
            ]}>
              {formatCurrency(stats.monthlyBalance)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Saldo Geral</Text>
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
            Receitas ({income.length}) — Total: {formatCurrency(stats.monthlyIncomes)}
          </Text>
          {income.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma receita registada neste mês.</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.colDate, styles.colHeader]}>Data</Text>
                <Text style={[styles.colDescription, styles.colHeader]}>Descrição</Text>
                <Text style={[styles.colCategory, styles.colHeader]}>Categoria</Text>
                <Text style={[styles.colAmountHeader]}>Valor</Text>
              </View>
              {income.map((t, i) => (
                <View key={t.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
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
            Despesas ({expenses.length}) — Total: {formatCurrency(stats.monthlyExpenses)}
          </Text>
          {expenses.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma despesa registada neste mês.</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.colDate, styles.colHeader]}>Data</Text>
                <Text style={[styles.colDescription, styles.colHeader]}>Descrição</Text>
                <Text style={[styles.colCategory, styles.colHeader]}>Categoria</Text>
                <Text style={[styles.colAmountHeader]}>Valor</Text>
              </View>
              {expenses.map((t, i) => (
                <View key={t.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
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
          <Text style={styles.footerText}>ChurchOS — Sistema de Gestão de Igreja</Text>
          <Text style={styles.footerText}>
            {monthName} {year} — Confidencial
          </Text>
        </View>

      </Page>
    </Document>
  );
}