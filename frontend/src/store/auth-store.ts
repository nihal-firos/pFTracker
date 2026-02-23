import { create } from "zustand";

import type { AuthResponse, AuthTokens, User } from "@/types/auth";
import { clearAuthState, loadAuthState, saveAuthState } from "@/utils/auth-storage";

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  setAuth: (payload: AuthResponse) => void;
  setTokens: (tokens: AuthTokens) => void;
  logout: () => void;
}

const persisted = loadAuthState();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: persisted?.user ?? null,
  tokens: persisted?.tokens ?? null,
  isAuthenticated: Boolean(persisted?.tokens?.access_token),
  setAuth: ({ user, tokens }) => {
    saveAuthState({ user, tokens });
    set({ user, tokens, isAuthenticated: true });
  },
  setTokens: (tokens) => {
    const currentUser = get().user;
    if (!currentUser) {
      clearAuthState();
      set({ user: null, tokens: null, isAuthenticated: false });
      return;
    }
    saveAuthState({ user: currentUser, tokens });
    set({ tokens, isAuthenticated: true });
  },
  logout: () => {
    clearAuthState();
    set({ user: null, tokens: null, isAuthenticated: false });
  },
}));