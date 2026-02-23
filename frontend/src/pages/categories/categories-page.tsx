import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createCategory, deleteCategory, getCategories } from "@/api/categories";
import { CategoriesGrid } from "@/components/categories/categories-grid";
import { CategoryCreateForm } from "@/components/categories/category-create-form";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/utils/errors";

export function CategoriesPage(): JSX.Element {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: getCategories });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      setFeedback({ type: "success", message: "Category created." });
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error) => setFeedback({ type: "error", message: getErrorMessage(error, "Could not create category.") }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      setFeedback({ type: "success", message: "Category deleted." });
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => setFeedback({ type: "error", message: getErrorMessage(error, "Could not delete category.") }),
  });

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 2800);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  return (
    <main className="mx-auto w-full max-w-7xl animate-fade-in-up px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Manage Labels</p>
        <h2 className="mt-2 text-2xl font-semibold">Categories</h2>
      </header>

      {feedback && (
        <Card className={`mb-4 ${feedback.type === "error" ? "border-destructive/40" : "border-emerald-500/40"}`}>
          <CardContent className={`p-3 text-sm ${feedback.type === "error" ? "text-destructive" : "text-emerald-400"}`}>
            {feedback.message}
          </CardContent>
        </Card>
      )}

      <section className="rounded-xl border border-border/80 bg-card/70 p-4">
        <CategoryCreateForm
          isPending={createMutation.isPending}
          onSubmit={(values) =>
            createMutation.mutate({
              name: values.name,
              type: values.type,
              color: values.color,
            })
          }
        />
      </section>

      <section className="mt-4">
        {categoriesQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-36 w-full" />
            ))}
          </div>
        ) : (
          <CategoriesGrid
            categories={categoriesQuery.data ?? []}
            isDeleting={deleteMutation.isPending}
            onDelete={(id, name) => {
              if (window.confirm(`Delete category \"${name}\"?`)) {
                deleteMutation.mutate(id);
              }
            }}
          />
        )}
      </section>
    </main>
  );
}