import { create } from "zustand";
import { authService } from "@/services/auth/auth.service";
import { IUser, ILoginRequest, IRegistRequest } from "@/services/auth/auth.types";

interface AuthState {
  user: IUser | null;
  isAuth: boolean;
  loading: boolean;
  error: string | null;

  init: () => Promise<void>;
  login: (p: ILoginRequest) => Promise<void>;
  register: (p: IRegistRequest) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuth: false,
  loading: true,
  error: null,

  init: async () => {
    try {
      const res = await authService.refresh();
      set({
        user: res.user ?? null,
        isAuth: true,
        loading: false,
      });
    } catch {
      set({
        user: null,
        isAuth: false,
        loading: false,
      });
    }
  },

  login: async (payload) => {
    try {
      set({ loading: true, error: null });
      const res = await authService.login(payload);
      set({
        user: res.user,
        isAuth: true,
        loading: false,
      });
    } catch (e) {
      set({
        error: "Неверный логин или пароль",
        loading: false,
      });
    }
  },

  register: async (payload) => {
    await authService.register(payload);
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuth: false });
    window.location.href = "/login";
  },
}));
