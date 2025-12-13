import { create } from "zustand";
import { authService, RegisterPayload } from "@/services/auth/auth.service";

interface User {
  id: string;
  email: string;
  name: string;
  surname: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuth: boolean;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  init: () => Promise<void>;
  login: (p: { email: string; password: string }) => Promise<void>;
  register: (p: RegisterPayload) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuth: false,
  loading: false,
  initialized: false,
  error: null,

  init: async () => {
    try {
      const res = await authService.refresh();
      set({
        user: res.user ?? null,
        isAuth: true,
        initialized: true,
      });
    } catch {
      set({
        user: null,
        isAuth: false,
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

  logout: () => {
    authService.logout();
    set({
      user: null,
      isAuth: false,
      initialized: false,
    });
  },
}));
