"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { monthlyData } from "@/lib/mock-data";

/**
 * Formatter simples e humano para Kwanza (UX-friendly)
 */
const formatKzShort = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} M Kz`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)} mil Kz`;
  }

  return `${value} Kz`;
};

const chartConfig = {
  income: {
    label: "Renda",
    color: "var(--color-primary)",
  },
  expenses: {
    label: "Despesas",
    color: "var(--color-muted-foreground)",
  },
} satisfies ChartConfig;

export function FinanceChart() {
  return (
    <Card className="card-shadow rounded-2xl border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground">
          Receitas vs Despesas
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Comparação financeira mensal
        </p>
      </CardHeader>

      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            data={monthlyData}
            margin={{ top: 5, right: 10, left: 40, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--color-border)"
            />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              dy={10}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              tickFormatter={formatKzShort}
            />

            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value: number, name: string) => {
                    const formattedValue = new Intl.NumberFormat("pt-PT", {
                      style: "currency",
                      currency: "AOA",
                      minimumFractionDigits: 0,
                    }).format(value);

                    return `${name}: ${formattedValue}`;
                  }}
                />
              }
            />

            <ChartLegend content={<ChartLegendContent />} />

            <Bar
              dataKey="income"
              name="Renda"
              fill="var(--color-income)"
              radius={[4, 4, 0, 0]}
              barSize={18}
            />

            <Bar
              dataKey="expenses"
              name="Despesas"
              fill="var(--color-expenses)"
              radius={[4, 4, 0, 0]}
              barSize={18}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
