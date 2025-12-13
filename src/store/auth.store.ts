import { create } from "zustand";
import { authService } from "@/services/auth/auth.service";
import {
  IUser,
  ILoginRequest,
  IRegistRequest,
} from "@/services/auth/auth.types";

interface AuthState {
  user: IUser | null;
  isAuth: boolean;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  init: () => Promise<void>;
  login: (payload: ILoginRequest) => Promise<void>;
  register: (payload: IRegistRequest) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuth: false,
  loading: false,
  initialized: false,
  error: null,

  // 🔴 ЕДИНСТВЕННОЕ МЕСТО, ГДЕ ВЫЗЫВАЕТСЯ refresh
  init: async () => {
    try {
      set({ loading: true });

      const res = await authService.refresh();

      set({
        user: res.user ?? null,
        isAuth: true,
        loading: false,
        initialized: true,
      });
    } catch {
      set({
        user: null,
        isAuth: false,
        loading: false,
        initialized: true,
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
    } catch {
      set({
        error: "Неверный логин или пароль",
        loading: false,
      });
    }
  },

  register: async (payload) => {
    try {
      set({ loading: true, error: null });
      await authService.register(payload);
      set({ loading: false });
    } catch {
      set({
        error: "Ошибка регистрации",
        loading: false,
      });
      throw new Error();
    }
  },

  logout: async () => {
    await authService.logout();
    set({
      user: null,
      isAuth: false,
      initialized: true,
    });
  },
}));
