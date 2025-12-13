import { create } from "zustand";
import { authService, LoginPayload, RegisterPayload } from "@/services/auth/auth.service";

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuth: boolean;
  loading: boolean;
  error: string | null;

  init: () => Promise<void>;
  login: (p: LoginPayload) => Promise<void>;
  register: (p: RegisterPayload) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuth: false,
  loading: false,
  error: null,

  init: async () => {
    try {
      set({ loading: true });
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

      await authService.login(payload);

      set({
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
      set({ error: "Ошибка регистрации", loading: false });
      throw new Error();
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuth: false });
  },
}));
