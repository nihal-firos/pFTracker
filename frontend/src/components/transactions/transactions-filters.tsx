import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CategoryItem } from "@/types/category";

export interface TransactionFilters {
  type: "all" | "income" | "expense";
  categoryId: "all" | number;
  startDate: string;
  endDate: string;
}

interface TransactionsFiltersProps {
  value: TransactionFilters;
  categories: CategoryItem[];
  onChange: (next: TransactionFilters) => void;
  onAdd: () => void;
}

export function TransactionsFilters({ value, categories, onChange, onAdd }: TransactionsFiltersProps): JSX.Element {
  return (
    <section className="rounded-xl border border-border/80 bg-card/70 p-4">
      <div className="grid gap-3 md:grid-cols-5">
        <FilterSelect
          label="Type"
          value={value.type}
          onValueChange={(type) => onChange({ ...value, type: type as TransactionFilters["type"] })}
          options={[
            { label: "All", value: "all" },
            { label: "Income", value: "income" },
            { label: "Expense", value: "expense" },
          ]}
        />

        <FilterSelect
          label="Category"
          value={String(value.categoryId)}
          onValueChange={(categoryValue) =>
            onChange({ ...value, categoryId: categoryValue === "all" ? "all" : Number(categoryValue) })
          }
          options={[{ label: "All", value: "all" }, ...categories.map((c) => ({ label: c.name, value: String(c.id) }))]}
        />

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-muted-foreground">Start date</label>
          <Input type="date" value={value.startDate} onChange={(event) => onChange({ ...value, startDate: event.target.value })} />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-muted-foreground">End date</label>
          <Input type="date" value={value.endDate} onChange={(event) => onChange({ ...value, endDate: event.target.value })} />
        </div>

        <div className="flex items-end justify-end">
          <Button className="w-full md:w-auto" onClick={onAdd}>Add transaction</Button>
        </div>
      </div>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onValueChange: (value: string) => void;
}): JSX.Element {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}