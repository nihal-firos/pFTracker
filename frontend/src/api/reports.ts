import { apiClient } from "@/api/client";
import type { ReportByCategoryResponse, ReportMonthlyResponse, ReportSummary } from "@/types/report";
import type { DateRangeParams } from "@/types/common";
import { buildDateParams } from "@/utils/query-params";

export async function getSummary(params?: DateRangeParams): Promise<ReportSummary> {
  const { data } = await apiClient.get<ReportSummary>("/reports/summary", { params: buildDateParams(params) });
  return data;
}

export async function getByCategory(params?: DateRangeParams & { type?: "income" | "expense" }): Promise<ReportByCategoryResponse> {
  const { data } = await apiClient.get<ReportByCategoryResponse>("/reports/by-category", {
    params: {
      ...buildDateParams(params),
      ...(params?.type ? { type: params.type } : {}),
    },
  });
  return data;
}

export async function getMonthly(params?: DateRangeParams): Promise<ReportMonthlyResponse> {
  const { data } = await apiClient.get<ReportMonthlyResponse>("/reports/monthly", { params: buildDateParams(params) });
  return data;
}