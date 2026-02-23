import { Cell, Pie, PieChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, formatShortMonth, toNumber } from "@/utils/formatters";

export function DashboardPage(): JSX.Element {
  const { summaryQuery, byCategoryQuery, monthlyQuery, recentTransactionsQuery } = useDashboardData();

  const hasError = summaryQuery.isError || byCategoryQuery.isError || monthlyQuery.isError || recentTransactionsQuery.isError;

  const donutData = (byCategoryQuery.data?.items ?? []).map((item) => ({
    name: item.category_name,
    value: toNumber(item.total),
    color: item.category_color,
  }));

  const monthlyData = (monthlyQuery.data?.items ?? []).map((item) => ({
    month: formatShortMonth(item.month),
    income: toNumber(item.income),
    expenses: toNumber(item.expenses),
  }));

  const recent = recentTransactionsQuery.data?.items ?? [];

  return (
    <main className="mx-auto w-full max-w-7xl animate-fade-in-up px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Overview</p>
        <h2 className="mt-2 text-2xl font-semibold">Dashboard</h2>
      </div>

      {hasError && (
        <Card className="mb-6 border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">
            Failed to load one or more dashboard sections. Please refresh the page.
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Net Balance"
          value={summaryQuery.data ? formatCurrency(summaryQuery.data.net) : null}
          loading={summaryQuery.isLoading}
          className="xl:col-span-2"
          tone="net"
        />
        <MetricCard
          title="Total Income"
          value={summaryQuery.data ? formatCurrency(summaryQuery.data.income) : null}
          loading={summaryQuery.isLoading}
          tone="income"
        />
        <MetricCard
          title="Total Expenses"
          value={summaryQuery.data ? formatCurrency(summaryQuery.data.expenses) : null}
          loading={summaryQuery.isLoading}
          tone="expense"
        />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {byCategoryQuery.isLoading ? (
              <Skeleton className="h-[290px] w-full" />
            ) : donutData.length === 0 ? (
              <EmptyState label="No expense transactions yet." />
            ) : (
              <div className="h-[290px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={105} paddingAngle={2}>
                      {donutData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyQuery.isLoading ? (
              <Skeleton className="h-[290px] w-full" />
            ) : monthlyData.length === 0 ? (
              <EmptyState label="No monthly data to display yet." />
            ) : (
              <div className="h-[290px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="income" fill="#17c964" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expenses" fill="#f31260" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactionsQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <EmptyState label="No transactions available." />
            ) : (
              <ul className="space-y-2">
                {recent.map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between rounded-lg border border-border/70 bg-background/45 px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{tx.category.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.date)}{tx.note ? ` • ${tx.note}` : ""}</p>
                    </div>
                    <p className={cn("text-sm font-semibold", tx.type === "income" ? "text-emerald-400" : "text-rose-400")}>
                      {tx.type === "income" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function MetricCard({
  title,
  value,
  loading,
  className,
  tone = "net",
}: {
  title: string;
  value: string | null;
  loading: boolean;
  className?: string;
  tone?: "net" | "income" | "expense";
}): JSX.Element {
  const toneClass =
    tone === "income" ? "text-emerald-400" : tone === "expense" ? "text-rose-400" : "text-cyan-300";

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-32" /> : <p className={cn("text-3xl font-semibold", toneClass)}>{value}</p>}
      </CardContent>
    </Card>
  );
}

function EmptyState({ label }: { label: string }): JSX.Element {
  return <div className="rounded-lg border border-dashed border-border/80 px-4 py-12 text-center text-sm text-muted-foreground">{label}</div>;
}