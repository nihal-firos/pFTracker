import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getByCategory, getMonthly, getSummary } from "@/api/reports";
import { ReportsCharts } from "@/components/reports/reports-charts";
import { ReportsFilters } from "@/components/reports/reports-filters";
import { ReportsSummaryCards } from "@/components/reports/reports-summary-cards";
import { Card, CardContent } from "@/components/ui/card";
import { downloadCsv } from "@/utils/csv";

export function ReportsPage(): JSX.Element {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const params = useMemo(
    () => ({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [endDate, startDate]
  );

  const summaryQuery = useQuery({
    queryKey: ["reports", "summary", params],
    queryFn: () => getSummary(params),
  });

  const byCategoryQuery = useQuery({
    queryKey: ["reports", "by-category", params],
    queryFn: () => getByCategory(params),
  });

  const monthlyQuery = useQuery({
    queryKey: ["reports", "monthly", params],
    queryFn: () => getMonthly(params),
  });

  const isLoading = summaryQuery.isLoading || byCategoryQuery.isLoading || monthlyQuery.isLoading;
  const hasError = summaryQuery.isError || byCategoryQuery.isError || monthlyQuery.isError;

  function exportCsv(): void {
    const summary = summaryQuery.data;
    const monthlyRows = monthlyQuery.data?.items ?? [];
    const categoryRows = byCategoryQuery.data?.items ?? [];

    const rows: string[][] = [
      ["Section", "Metric", "Value", "Notes"],
      ["Summary", "Income", summary?.income ?? "0", ""],
      ["Summary", "Expenses", summary?.expenses ?? "0", ""],
      ["Summary", "Net", summary?.net ?? "0", ""],
      ...monthlyRows.map((item) => ["Monthly", item.month, item.net, `Income:${item.income} Expenses:${item.expenses}`]),
      ...categoryRows.map((item) => ["Category", item.category_name, item.total, `${item.type} (${item.percentage}%)`]),
    ];

    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`reports-${stamp}.csv`, rows[0], rows.slice(1));
  }

  return (
    <main className="mx-auto w-full max-w-7xl animate-fade-in-up px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Insights</p>
        <h2 className="mt-2 text-2xl font-semibold">Reports</h2>
      </header>

      {hasError && (
        <Card className="mb-4 border-destructive/40">
          <CardContent className="p-3 text-sm text-destructive">Some report sections failed to load. Adjust filters or retry.</CardContent>
        </Card>
      )}

      <ReportsFilters
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onClear={() => {
          setStartDate("");
          setEndDate("");
        }}
        onExport={exportCsv}
        isExportDisabled={isLoading}
      />

      <ReportsSummaryCards
        loading={isLoading}
        income={summaryQuery.data?.income}
        expenses={summaryQuery.data?.expenses}
        net={summaryQuery.data?.net}
      />

      <ReportsCharts monthly={monthlyQuery.data} byCategory={byCategoryQuery.data} loading={isLoading} />
    </main>
  );
}