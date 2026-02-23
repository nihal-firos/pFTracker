import type { AxiosError } from "axios";

interface ApiErrorPayload {
  detail?: string;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<ApiErrorPayload>;
  const detail = axiosError.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  return fallback;
}