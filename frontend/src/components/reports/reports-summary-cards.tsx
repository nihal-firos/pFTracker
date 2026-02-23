import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/utils/formatters";

interface ReportsSummaryCardsProps {
  loading: boolean;
  income?: string;
  expenses?: string;
  net?: string;
}

export function ReportsSummaryCards({ loading, income, expenses, net }: ReportsSummaryCardsProps): JSX.Element {
  return (
    <section className="mt-4 grid gap-4 md:grid-cols-3">
      <SummaryCard title="Income" value={income} loading={loading} tone="income" />
      <SummaryCard title="Expenses" value={expenses} loading={loading} tone="expense" />
      <SummaryCard title="Net" value={net} loading={loading} tone="net" />
    </section>
  );
}

function SummaryCard({
  title,
  value,
  loading,
  tone,
}: {
  title: string;
  value?: string;
  loading: boolean;
  tone: "income" | "expense" | "net";
}): JSX.Element {
  const toneClass = tone === "income" ? "text-emerald-400" : tone === "expense" ? "text-rose-400" : "text-cyan-300";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm uppercase tracking-[0.14em] text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-32" /> : <p className={`text-3xl font-semibold ${toneClass}`}>{formatCurrency(value ?? 0)}</p>}
      </CardContent>
    </Card>
  );
}