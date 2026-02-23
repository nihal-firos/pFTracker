import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CategoryItem } from "@/types/category";
import type { TransactionItem } from "@/types/transaction";

const schema = z.object({
  type: z.enum(["income", "expense"]),
  category_id: z.number().int().positive(),
  amount: z.coerce.number().positive(),
  date: z.string().min(1, "Date is required."),
  note: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryItem[];
  editing: TransactionItem | null;
  isPending: boolean;
  onSubmit: (values: FormValues) => void;
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  categories,
  editing,
  isPending,
  onSubmit,
}: TransactionFormDialogProps): JSX.Element {
  const isEdit = Boolean(editing);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "expense",
      category_id: 0,
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      note: "",
    },
  });

  useEffect(() => {
    if (!open) return;

    if (editing) {
      reset({
        type: editing.type,
        category_id: editing.category_id,
        amount: Number(editing.amount),
        date: editing.date,
        note: editing.note ?? "",
      });
      return;
    }

    reset({
      type: "expense",
      category_id: 0,
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      note: "",
    });
  }, [editing, open, reset]);

  const selectedType = watch("type");
  const selectedCategoryId = watch("category_id");
  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === selectedType),
    [categories, selectedType]
  );

  useEffect(() => {
    const selectedCategory = filteredCategories.find((item) => item.id === selectedCategoryId);
    if (!selectedCategory && filteredCategories.length > 0) {
      setValue("category_id", filteredCategories[0].id, { shouldValidate: true });
    }
  }, [filteredCategories, selectedCategoryId, setValue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit transaction" : "Add transaction"}</DialogTitle>
        </DialogHeader>

        <form className="mt-3 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-muted-foreground">Type</label>
              <Select value={selectedType} onValueChange={(value: "income" | "expense") => setValue("type", value, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-muted-foreground">Category</label>
              <Select value={String(selectedCategoryId || "")} onValueChange={(value) => setValue("category_id", Number(value), { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && <p className="mt-1 text-xs text-destructive">{errors.category_id.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-muted-foreground">Amount</label>
              <Input type="number" step="0.01" min="0" {...register("amount")} />
              {errors.amount && <p className="mt-1 text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-muted-foreground">Date</label>
              <Input type="date" {...register("date")} />
              {errors.date && <p className="mt-1 text-xs text-destructive">{errors.date.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-muted-foreground">Note</label>
            <Textarea placeholder="Optional note" {...register("note")} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || filteredCategories.length === 0}>
              {isPending ? "Saving..." : isEdit ? "Save changes" : "Create transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
