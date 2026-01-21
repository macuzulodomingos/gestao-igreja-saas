"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChartConfig, 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { monthlyData } from "@/lib/mock-data";

// Configuração do tema para o gráfico
const chartConfig = {
  members: {
    label: "Membros",
    color: "var(--color-primary)", // Usa o Roxo do seu @theme no globals.css
  },
} satisfies ChartConfig;

export function MembersChart() {
  return (
    <Card className="card-shadow rounded-2xl border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground">
          Crescimento de membros
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Tendência de adesão nos últimos 12 meses
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart
            data={monthlyData}
            /* Aumentei a margem 'left' para 35 para os números do eixo Y não cortarem */
            margin={{ top: 5, right: 10, left: 35, bottom: 5 }}
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
              /* Define o intervalo para os números não ficarem colados */
              domain={["dataMin - 5", "dataMax + 5"]}
              /* Removido o 'hide' para os números aparecerem */
            />
            
            <ChartTooltip 
              cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
              content={<ChartTooltipContent />} 
            />
            
            <Line
              type="monotone"
              dataKey="members"
              stroke="var(--color-members)"
              strokeWidth={3}
              dot={{ 
                fill: "var(--color-background)", 
                stroke: "var(--color-members)", 
                strokeWidth: 2, 
                r: 4 
              }}
              activeDot={{ 
                r: 6, 
                fill: "var(--color-members)",
                stroke: "var(--color-background)",
                strokeWidth: 2
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}