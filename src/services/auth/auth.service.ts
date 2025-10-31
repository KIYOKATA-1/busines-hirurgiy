import { api } from "@/lib/axios";
import { setCookie, getCookie, deleteCookie } from "@/utils/cookies";
import { ILoginRequest, ILoginResponse, IRefreshResponse } from "./auth.types";

class AuthService {
  async login(payload: ILoginRequest): Promise<ILoginResponse> {
    const res = await api.post<ILoginResponse>("/api/v1/auth/login", payload);
    const { accessToken, user } = res.data;
    setCookie("access_token", accessToken, 1);
    return { accessToken, user };
  }

  async refresh(): Promise<IRefreshResponse> {
    const csrf = getCookie("csrf_token");
    const res = await api.post<IRefreshResponse>(
      "/api/v1/auth/login/refresh",
      { refreshToken: "" },
      { headers: csrf ? { "X-CSRF": csrf } : {} }
    );

    const { accessToken, user } = res.data;
    setCookie("access_token", accessToken, 1);
    return { accessToken, user };
  }

  logout() {
    deleteCookie("access_token");
  }

  getAccessToken(): string | null {
    return getCookie("access_token");
  }
}

export const authService = new AuthService();
