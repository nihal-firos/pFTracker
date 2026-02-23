import { apiClient } from "@/api/client";
import type { AuthResponse, AuthTokens, LoginPayload, RefreshPayload, RegisterPayload } from "@/types/auth";

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function refresh(payload: RefreshPayload): Promise<AuthTokens> {
  const { data } = await apiClient.post<AuthTokens>("/auth/refresh", payload);
  return data;
}

export async function demoLogin(): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/demo");
  return data;
}
