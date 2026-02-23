export interface CategoryItem {
  id: number;
  name: string;
  type: "income" | "expense";
  color: string;
  transaction_count: number;
}

export interface CategoryCreatePayload {
  name: string;
  type: "income" | "expense";
  color: string;
}