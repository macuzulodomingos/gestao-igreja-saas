"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { useTranslations } from "next-intl";

const formatKzShort = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)} mil`;
  return `${value}`;
};

interface FinanceChartProps {
  data: { month: string; income: number; expenses: number }[];
}

export function FinanceChart({ data }: FinanceChartProps) {
  const t = useTranslations("dashboard");

  const chartConfig = {
    income: { label: t("incomeLabel"), color: "var(--color-primary)" },
    expenses: { label: t("expensesLabel"), color: "var(--color-muted-foreground)" },
  } satisfies ChartConfig;

  return (
    <Card className="card-shadow rounded-2xl border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{t("incomeVsExpenses")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("last6months")}</p>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="month" axisLine={false} tickLine={false}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              tickFormatter={formatKzShort} />
            <ChartTooltip content={<ChartTooltipContent
              formatter={(value) =>
                new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", minimumFractionDigits: 0 })
                  .format(Number(value)).replace("AOA", "Kz")
              }
            />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="income" name={t("incomeLabel")} fill="var(--color-income)" radius={[4, 4, 0, 0]} barSize={18} />
            <Bar dataKey="expenses" name={t("expensesLabel")} fill="var(--color-expenses)" radius={[4, 4, 0, 0]} barSize={18} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}