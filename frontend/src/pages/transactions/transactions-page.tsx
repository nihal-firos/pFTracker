import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getCategories } from "@/api/categories";
import { createTransaction, deleteTransaction, getTransactions, updateTransaction } from "@/api/transactions";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { TransactionsFilters, type TransactionFilters } from "@/components/transactions/transactions-filters";
import { TransactionsPagination } from "@/components/transactions/transactions-pagination";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { TransactionItem } from "@/types/transaction";
import { getErrorMessage } from "@/utils/errors";

const PAGE_SIZE = 10;

export function TransactionsPage(): JSX.Element {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [filters, setFilters] = useState<TransactionFilters>({
    type: "all",
    categoryId: "all",
    startDate: "",
    endDate: "",
  });

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: getCategories });

  const transactionsQuery = useQuery({
    queryKey: ["transactions", page, filters],
    queryFn: () =>
      getTransactions({
        page,
        pageSize: PAGE_SIZE,
        type: filters.type === "all" ? undefined : filters.type,
        categoryId: filters.categoryId === "all" ? undefined : filters.categoryId,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      setFeedback({ type: "success", message: "Transaction created." });
      closeDialog();
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => setFeedback({ type: "error", message: getErrorMessage(error, "Could not create transaction.") }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof updateTransaction>[1] }) => updateTransaction(id, payload),
    onSuccess: () => {
      setFeedback({ type: "success", message: "Transaction updated." });
      closeDialog();
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => setFeedback({ type: "error", message: getErrorMessage(error, "Could not update transaction.") }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      setFeedback({ type: "success", message: "Transaction deleted." });
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => setFeedback({ type: "error", message: getErrorMessage(error, "Could not delete transaction.") }),
  });

  const categories = categoriesQuery.data ?? [];
  const items = transactionsQuery.data?.items ?? [];
  const pagination = transactionsQuery.data?.pagination;

  const filteredCategories = useMemo(() => {
    if (filters.type === "all") {
      return categories;
    }
    return categories.filter((category) => category.type === filters.type);
  }, [categories, filters.type]);

  function closeDialog(): void {
    setFormOpen(false);
    setEditing(null);
  }

  function openCreateDialog(): void {
    setEditing(null);
    setFormOpen(true);
  }

  function openEditDialog(item: TransactionItem): void {
    setEditing(item);
    setFormOpen(true);
  }

  function onDelete(item: TransactionItem): void {
    if (window.confirm(`Delete transaction from ${item.category.name}?`)) {
      deleteMutation.mutate(item.id);
    }
  }

  function onFiltersChange(next: TransactionFilters): void {
    setFilters(next);
    setPage(1);
  }

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 2800);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (!pagination) return;
    if (pagination.total_pages > 0 && page > pagination.total_pages) {
      setPage(pagination.total_pages);
    }
  }, [page, pagination]);

  return (
    <main className="mx-auto w-full max-w-7xl animate-fade-in-up px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Manage Records</p>
          <h2 className="mt-2 text-2xl font-semibold">Transactions</h2>
        </div>
        <Button onClick={openCreateDialog}>Add transaction</Button>
      </header>

      {feedback && (
        <Card className={`fixed right-4 top-4 z-40 w-[min(92vw,420px)] ${feedback.type === "error" ? "border-destructive/40" : "border-emerald-500/40"}`}>
          <CardContent className={`p-3 text-sm ${feedback.type === "error" ? "text-destructive" : "text-emerald-400"}`}>
            {feedback.message}
          </CardContent>
        </Card>
      )}

      <TransactionsFilters value={filters} categories={filteredCategories} onChange={onFiltersChange} onAdd={openCreateDialog} />

      <section className="mt-4 rounded-xl border border-border/80 bg-card/70 p-3 md:p-4">
        <TransactionsTable
          items={items}
          isLoading={transactionsQuery.isLoading || categoriesQuery.isLoading}
          onEdit={openEditDialog}
          onDelete={onDelete}
        />
      </section>

      <TransactionsPagination
        page={pagination?.page ?? page}
        totalPages={pagination?.total_pages ?? 0}
        totalItems={pagination?.total ?? 0}
        pageSize={PAGE_SIZE}
        onPageChange={(nextPage) => setPage(nextPage)}
      />

      <TransactionFormDialog
        open={formOpen}
        onOpenChange={(open) => (open ? setFormOpen(true) : closeDialog())}
        categories={categories}
        editing={editing}
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={(values) => {
          const payload = {
            type: values.type,
            category_id: values.category_id,
            amount: values.amount,
            note: values.note || null,
            date: values.date,
          };

          if (editing) {
            updateMutation.mutate({ id: editing.id, payload });
            return;
          }

          createMutation.mutate(payload);
        }}
      />
    </main>
  );
}
