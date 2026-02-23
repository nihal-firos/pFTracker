import type { AuthTokens, User } from "@/types/auth";

const AUTH_STORAGE_KEY = "pftracker.auth";

export interface StoredAuthState {
  user: User;
  tokens: AuthTokens;
}

export function loadAuthState(): StoredAuthState | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredAuthState;
    if (!parsed.tokens?.access_token || !parsed.tokens?.refresh_token || !parsed.user?.id) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function saveAuthState(state: StoredAuthState): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
}

export function clearAuthState(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAccessToken(): string | null {
  return loadAuthState()?.tokens.access_token ?? null;
}