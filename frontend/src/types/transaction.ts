export interface TransactionCategory {
  id: number;
  name: string;
  type: "income" | "expense";
  color: string;
}

export interface TransactionItem {
  id: number;
  category_id: number;
  amount: string;
  type: "income" | "expense";
  note: string | null;
  date: string;
  created_at: string;
  category: TransactionCategory;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface TransactionListResponse {
  items: TransactionItem[];
  pagination: PaginationMeta;
}