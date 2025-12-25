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

  init: async () => {
    set({ loading: true, error: null });

    try {
      const access = authService.getAccessToken();
      if (access) {
        const me = await userService.me();
        set({
          user: me,
          isAuth: true,
          loading: false,
          initialized: true,
        });
        return;
      }

      await authService.refresh();

      const me = await userService.me();

      set({
        user: me,
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

      await authService.login(payload);

      const me = await userService.me();

      set({
        user: me,
        isAuth: true,
        loading: false,
      });
    } catch {
      set({
        error: "Неверный логин или пароль",
        loading: false,
        isAuth: false,
        user: null,
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
    set({
      user: null,
      isAuth: false,
      initialized: true,
      loading: false,
      error: null,
    });
  },
}));
