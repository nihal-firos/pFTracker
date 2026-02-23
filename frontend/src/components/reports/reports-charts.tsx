import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReportByCategoryResponse, ReportMonthlyResponse } from "@/types/report";
import { formatCurrency, formatShortMonth, toNumber } from "@/utils/formatters";

interface ReportsChartsProps {
  monthly?: ReportMonthlyResponse;
  byCategory?: ReportByCategoryResponse;
  loading: boolean;
}

export function ReportsCharts({ monthly, byCategory, loading }: ReportsChartsProps): JSX.Element {
  const monthlyData = (monthly?.items ?? []).map((item) => ({
    month: formatShortMonth(item.month),
    net: toNumber(item.net),
  }));

  const categoryData = (byCategory?.items ?? []).map((item) => ({
    name: item.category_name,
    total: toNumber(item.total),
  }));

  return (
    <section className="mt-4 grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : monthlyData.length === 0 ? (
            <EmptyState label="No monthly trend data for this period." />
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="net" stroke="#00c2ff" strokeWidth={2.8} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : categoryData.length === 0 ? (
            <EmptyState label="No category totals for this period." />
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 16, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis type="category" dataKey="name" width={110} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="total" fill="#17c964" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function EmptyState({ label }: { label: string }): JSX.Element {
  return <div className="rounded-lg border border-dashed border-border/80 px-4 py-12 text-center text-sm text-muted-foreground">{label}</div>;
}