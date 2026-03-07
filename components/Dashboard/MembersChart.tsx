// MembersChart.tsx
"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const chartConfig = {
  members: { label: "Membros", color: "var(--color-primary)" },
} satisfies ChartConfig;

interface MembersChartProps {
  data: { month: string; members: number }[];
}

export function MembersChart({ data }: MembersChartProps) {
  return (
    <Card className="card-shadow rounded-2xl border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Crescimento de membros</CardTitle>
        <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 35, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="month" axisLine={false} tickLine={false}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              domain={["dataMin - 5", "dataMax + 5"]} />
            <ChartTooltip cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
              content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="members" stroke="var(--color-members)"
              strokeWidth={3}
              dot={{ fill: "var(--color-background)", stroke: "var(--color-members)", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "var(--color-members)", stroke: "var(--color-background)", strokeWidth: 2 }} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}