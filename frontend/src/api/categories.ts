import { apiClient } from "@/api/client";
import type { CategoryCreatePayload, CategoryItem } from "@/types/category";

export async function getCategories(): Promise<CategoryItem[]> {
  const { data } = await apiClient.get<CategoryItem[]>("/categories");
  return data;
}

export async function createCategory(payload: CategoryCreatePayload): Promise<Omit<CategoryItem, "transaction_count">> {
  const { data } = await apiClient.post<Omit<CategoryItem, "transaction_count">>("/categories", payload);
  return data;
}

export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}