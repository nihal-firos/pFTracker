import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CategoryItem } from "@/types/category";

interface CategoriesGridProps {
  categories: CategoryItem[];
  isDeleting: boolean;
  onDelete: (id: number, name: string) => void;
}

export function CategoriesGrid({ categories, isDeleting, onDelete }: CategoriesGridProps): JSX.Element {
  if (categories.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 px-4 py-14 text-center text-sm text-muted-foreground">
        No categories yet. Create your first one above.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {categories.map((category) => (
        <Card key={category.id} className="overflow-hidden">
          <div className="h-1.5" style={{ backgroundColor: category.color }} />
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-foreground">{category.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">{category.type}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/40 text-destructive"
                onClick={() => onDelete(category.id, category.name)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              {category.transaction_count} transaction{category.transaction_count === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}