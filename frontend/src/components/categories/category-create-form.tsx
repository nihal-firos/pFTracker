import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80, "Name is too long."),
  type: z.enum(["income", "expense"]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Use a valid hex color."),
});

type FormValues = z.infer<typeof schema>;

interface CategoryCreateFormProps {
  isPending: boolean;
  onSubmit: (values: FormValues) => void;
}

export function CategoryCreateForm({ isPending, onSubmit }: CategoryCreateFormProps): JSX.Element {
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
      name: "",
      type: "expense",
      color: "#f31260",
    },
  });

  const selectedType = watch("type");

  function submit(values: FormValues): void {
    onSubmit(values);
    reset({
      name: "",
      type: values.type,
      color: values.type === "income" ? "#17c964" : "#f31260",
    });
  }

  return (
    <form className="grid gap-3 md:grid-cols-[1fr_180px_120px_auto]" onSubmit={handleSubmit(submit)}>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-muted-foreground">Category name</label>
        <Input placeholder="e.g. Groceries" {...register("name")} />
        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-muted-foreground">Type</label>
        <Select
          value={selectedType}
          onValueChange={(value: "income" | "expense") => {
            setValue("type", value, { shouldValidate: true });
            setValue("color", value === "income" ? "#17c964" : "#f31260", { shouldValidate: true });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-muted-foreground">Color</label>
        <Input type="color" className="h-10 p-1" {...register("color")} />
        {errors.color && <p className="mt-1 text-xs text-destructive">{errors.color.message}</p>}
      </div>

      <div className="flex items-end">
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating..." : "Create"}
        </Button>
      </div>
    </form>
  );
}