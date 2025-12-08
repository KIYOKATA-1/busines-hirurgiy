import { api } from "@/lib/axios";
import { setCookie, getCookie, deleteCookie } from "@/utils/cookies";
import {
  ILoginRequest,
  ILoginResponse,
  IRegistRequest,
  IRegisterResponse,
  IRefreshResponse,
} from "./auth.types";

class AuthService {
  async login(payload: ILoginRequest): Promise<ILoginResponse> {
    const res = await api.post<ILoginResponse>("/api/v1/auth/login", payload);
    const { accessToken, user } = res.data;
    setCookie("access_token", accessToken, 1);
    return { accessToken, user };
  }

  async register(payload: IRegistRequest): Promise<IRegisterResponse> {
    const res = await api.post<IRegisterResponse>("/api/v1/auth/register", payload);
    return res.data;
  }

  async refresh(): Promise<IRefreshResponse> {
    const csrf = getCookie("csrf_token");
    const res = await api.post<IRefreshResponse>(
      "/api/v1/auth/refresh",
      { refreshToken: "" },
      { headers: csrf ? { "X-CSRF": csrf } : {} }
    );

    const { accessToken, user } = res.data;
    setCookie("access_token", accessToken, 1);
    return { accessToken, user };
  }

  async loginWithGoogle(code: string, state?: string) {
    const res = await api.get("/api/v1/auth/oauth/google/callback", {
      params: { code, state },
    });

    const { accessToken, csrfToken, user } = res.data;

    if (accessToken) setCookie("access_token", accessToken, 1);
    if (csrfToken) setCookie("csrf_token", csrfToken, 1);

    return user;
  }

  logout() {
    deleteCookie("access_token");
  }

  getAccessToken(): string | null {
    return getCookie("access_token");
  }
}

export const authService = new AuthService();
