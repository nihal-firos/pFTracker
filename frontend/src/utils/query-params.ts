import type { DateRangeParams } from "@/types/common";

export function buildDateParams(params?: DateRangeParams): Record<string, string> {
  return {
    ...(params?.startDate ? { start_date: params.startDate } : {}),
    ...(params?.endDate ? { end_date: params.endDate } : {}),
  };
}