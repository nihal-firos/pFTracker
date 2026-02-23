import { Button } from "@/components/ui/button";

interface TransactionsPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (nextPage: number) => void;
}

export function TransactionsPagination({ page, totalPages, totalItems, pageSize, onPageChange }: TransactionsPaginationProps): JSX.Element {
  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-xl border border-border/80 bg-card/70 px-4 py-3 text-sm md:flex-row">
      <p className="text-muted-foreground">
        Showing page {page} of {Math.max(totalPages, 1)} ({totalItems} total, {pageSize} per page)
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Previous</Button>
        <Button size="sm" variant="outline" onClick={() => onPageChange(page + 1)} disabled={totalPages === 0 || page >= totalPages}>Next</Button>
      </div>
    </div>
  );
}