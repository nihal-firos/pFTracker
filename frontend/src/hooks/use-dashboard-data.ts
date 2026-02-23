import { useQuery } from "@tanstack/react-query";

import { getByCategory, getMonthly, getSummary } from "@/api/reports";
import { getTransactions } from "@/api/transactions";

export function useDashboardData() {
  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => getSummary(),
  });

  const byCategoryQuery = useQuery({
    queryKey: ["dashboard", "by-category", "expense"],
    queryFn: () => getByCategory({ type: "expense" }),
  });

  const monthlyQuery = useQuery({
    queryKey: ["dashboard", "monthly"],
    queryFn: () => getMonthly(),
  });

  const recentTransactionsQuery = useQuery({
    queryKey: ["dashboard", "recent-transactions"],
    queryFn: () => getTransactions({ page: 1, pageSize: 5 }),
  });

  return { summaryQuery, byCategoryQuery, monthlyQuery, recentTransactionsQuery };
}