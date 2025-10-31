import { create } from "zustand";
import { authService } from "@/services/auth/auth.service";
import { IUser, ILoginRequest } from "@/services/auth/auth.types";

interface AuthState {
  user: IUser | null;
  accessToken: string | null;
  isAuth: boolean;
  loading: boolean;
  error: string | null;

  init: () => Promise<void>;
  login: (payload: ILoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuth: false,
  loading: false,
  error: null,

  init: async () => {
    try {
      const token = authService.getAccessToken();
      if (token) {
        set({ accessToken: token, isAuth: true, loading: false });
        return;
      }
      const res = await authService.refresh();
      set({
        user: res.user ?? null,
        accessToken: res.accessToken,
        isAuth: true,
        loading: false,
      });
    } catch {
      set({ user: null, accessToken: null, isAuth: false, loading: false });
    }
  },

  login: async (payload: ILoginRequest) => {
    try {
      set({ loading: true, error: null });
      const res = await authService.login(payload);
      set({
        user: res.user,
        accessToken: res.accessToken,
        isAuth: true,
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Login failed",
        isAuth: false,
        loading: false,
      });
    }
  },

  logout: async () => {
    authService.logout();
    set({
      user: null,
      accessToken: null,
      isAuth: false,
      loading: false,
      error: null,
    });
  },
}));
