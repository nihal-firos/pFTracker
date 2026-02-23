import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { TransactionItem } from "@/types/transaction";
import { formatCurrency, formatDate } from "@/utils/formatters";

interface TransactionsTableProps {
  items: TransactionItem[];
  isLoading: boolean;
  onEdit: (item: TransactionItem) => void;
  onDelete: (item: TransactionItem) => void;
}

export function TransactionsTable({ items, isLoading, onEdit, onDelete }: TransactionsTableProps): JSX.Element {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, idx) => (
          <Skeleton key={idx} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 px-4 py-12 text-center text-sm text-muted-foreground">
        No transactions found for the selected filters.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Note</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id} className={cn(item.type === "income" ? "bg-emerald-500/5" : "bg-rose-500/5")}>
            <TableCell>{formatDate(item.date)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.category.color }} />
                {item.category.name}
              </div>
            </TableCell>
            <TableCell className="capitalize">{item.type}</TableCell>
            <TableCell className="max-w-[280px] truncate">{item.note || "-"}</TableCell>
            <TableCell className={cn("text-right font-semibold", item.type === "income" ? "text-emerald-400" : "text-rose-400")}>
              {item.type === "income" ? "+" : "-"}
              {formatCurrency(item.amount)}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => onEdit(item)}>Edit</Button>
                <Button size="sm" variant="outline" className="border-destructive/40 text-destructive" onClick={() => onDelete(item)}>
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}