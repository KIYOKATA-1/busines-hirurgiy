import { create } from "zustand";
import { authService } from "@/services/auth/auth.service";

export interface IUser {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  user: IUser | null;
  isAuth: boolean;
  loading: boolean;
  error: string | null;

  init: () => Promise<void>;
  login: (p: { email: string; password: string }) => Promise<void>;
  register: (p: {
    email: string;
    name: string;
    surname: string;
    password: string;
    role: "participant";
  }) => Promise<void>;
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
      await authService.login(payload);
      const res = await authService.refresh();
      set({
        user: res.user ?? null,
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
    set({
      user: null,
      isAuth: false,
    });
  },
}));
