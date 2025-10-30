import { create } from "zustand";
import { AuthService } from "@/services/auth/auth.service";
import { IUser, ILoginRequest } from "@/services/auth/auth.types";
import { tokenManager } from "@/services/auth/tokenManager";

interface AuthState {
  user: IUser | null;
  isAuth: boolean;
  loading: boolean;
  error: string | null;

  login: (payload: ILoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuth: false,
  loading: false,
  error: null,

  login: async (payload: ILoginRequest): Promise<void> => {
    try {
      set({ loading: true, error: null });

      const res = await AuthService.login(payload);

      set({
        user: res.user ?? null,
        isAuth: true,
        loading: false,
        error: null,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Login failed",
        isAuth: false,
      });

      tokenManager.clear();
    }
  },

  logout: async (): Promise<void> => {
    await AuthService.logout();

    set({
      user: null,
      isAuth: false,
      loading: false,
      error: null,
    });
  },
}));
