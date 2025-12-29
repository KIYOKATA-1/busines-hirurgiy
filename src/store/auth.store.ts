import { create } from "zustand";
import { authService } from "@/services/auth/auth.service";
import { userService } from "@/services/user/user.service";
import { IUserMe } from "@/services/user/user.types";
import { ILoginRequest, IRegistRequest } from "@/services/auth/auth.types";

interface AuthState {
  user: IUserMe | null;
  isAuth: boolean;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  accessToken: string | null;

  init: () => Promise<void>;
  login: (payload: ILoginRequest) => Promise<void>;
  register: (payload: IRegistRequest) => Promise<void>;
  logout: () => Promise<void>;

  setAccessToken: (token: string | null) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuth: false,
  loading: false,
  initialized: false,
  error: null,

  accessToken: null,

  setAccessToken: (token) => set({ accessToken: token }),
  clearSession: () =>
    set({
      user: null,
      isAuth: false,
      accessToken: null,
      loading: false,
      error: null,
      initialized: true,
    }),

  init: async () => {
    set({ loading: true, error: null });

    try {
      // 1) пробуем /me (вдруг accessToken уже стоит в памяти, например после навигации)
      const me = await userService.me();
      set({ user: me, isAuth: true, loading: false, initialized: true });
      return;
    } catch {
      // 2) если нет — пробуем refresh по cookie refresh_token
      try {
        const refreshed = await authService.refresh();
        if (refreshed?.accessToken) get().setAccessToken(refreshed.accessToken);

        const me = await userService.me();
        set({ user: me, isAuth: true, loading: false, initialized: true });
        return;
      } catch {
        get().clearSession();
      }
    }
  },

  login: async (payload) => {
    try {
      set({ loading: true, error: null });

      const res = await authService.login(payload);
      if (res?.accessToken) get().setAccessToken(res.accessToken);

      const me = await userService.me();
      set({ user: me, isAuth: true, loading: false });
    } catch {
      set({
        error: "Неверный логин или пароль",
        loading: false,
        isAuth: false,
        user: null,
        accessToken: null,
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

  logout: async () => {
    await authService.logout();
    get().clearSession();
  },
}));
