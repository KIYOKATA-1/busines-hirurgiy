import { plainAxios } from "@/lib/plainAxios";
import { getCookie } from "@/utils/cookies";
import {
  ILoginRequest,
  ILoginResponse,
  IRegistRequest,
  IRegisterResponse,
  IRefreshResponse,
} from "./auth.types";

class AuthService {
  setAccessToken(token: string) {
    document.cookie = `access_token=${token}; path=/`;
  }

  getAccessToken(): string | null {
    return getCookie("access_token");
  }

  clearAccessToken() {
    document.cookie = "access_token=; Max-Age=0; path=/";
  }

  async register(payload: IRegistRequest): Promise<IRegisterResponse> {
    const res = await plainAxios.post<IRegisterResponse>("/api/v1/auth/register", payload);
    return res.data;
  }

  async login(payload: ILoginRequest): Promise<ILoginResponse> {
    const res = await plainAxios.post<ILoginResponse>("/api/v1/auth/login", payload);
    this.setAccessToken(res.data.accessToken);
    return res.data;
  }

  async refresh(): Promise<IRefreshResponse> {
    const csrf = getCookie("csrf_token");
    if (!csrf) throw new Error("CSRF token not found");

    const res = await plainAxios.post<IRefreshResponse>(
      "/api/v1/auth/refresh",
      {},
      { headers: { "X-CSRF": csrf } }
    );

    this.setAccessToken(res.data.accessToken);
    return res.data;
  }

  async logout(): Promise<void> {
    try {
      await plainAxios.post("/api/v1/auth/logout");
    } catch {}
    this.clearAccessToken();
  }
}

export const authService = new AuthService();
