import { apiClient } from "@/api/client";
import type { TransactionItem, TransactionListResponse } from "@/types/transaction";

export interface TransactionListParams {
  page?: number;
  pageSize?: number;
  type?: "income" | "expense";
  categoryId?: number;
  startDate?: string;
  endDate?: string;
}

export interface TransactionUpsertPayload {
  category_id: number;
  amount: number;
  type: "income" | "expense";
  note?: string | null;
  date: string;
}

export async function getTransactions(params: TransactionListParams): Promise<TransactionListResponse> {
  const { data } = await apiClient.get<TransactionListResponse>("/transactions", {
    params: {
      ...(params.page ? { page: params.page } : {}),
      ...(params.pageSize ? { page_size: params.pageSize } : {}),
      ...(params.type ? { type: params.type } : {}),
      ...(params.categoryId ? { category_id: params.categoryId } : {}),
      ...(params.startDate ? { start_date: params.startDate } : {}),
      ...(params.endDate ? { end_date: params.endDate } : {}),
    },
  });
  return data;
}

export async function createTransaction(payload: TransactionUpsertPayload): Promise<TransactionItem> {
  const { data } = await apiClient.post<TransactionItem>("/transactions", payload);
  return data;
}

export async function updateTransaction(id: number, payload: TransactionUpsertPayload): Promise<TransactionItem> {
  const { data } = await apiClient.put<TransactionItem>(`/transactions/${id}`, payload);
  return data;
}

export async function deleteTransaction(id: number): Promise<void> {
  await apiClient.delete(`/transactions/${id}`);
}