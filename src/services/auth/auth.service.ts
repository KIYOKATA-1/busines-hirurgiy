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
  async register(payload: IRegistRequest): Promise<IRegisterResponse> {
    const res = await plainAxios.post<IRegisterResponse>(
      "/v1/auth/register",
      payload
    );
    return res.data;
  }

  async login(payload: ILoginRequest): Promise<ILoginResponse> {
    const res = await plainAxios.post<ILoginResponse>(
      "/v1/auth/login",
      payload
    );

    document.cookie = `access_token=${res.data.accessToken}; path=/`;
    return res.data;
  }

  async refresh(): Promise<IRefreshResponse> {
    const csrf = getCookie("csrf_token");
    if (!csrf) {
      throw new Error("CSRF token not found");
    }

    const res = await plainAxios.post<IRefreshResponse>(
      "/v1/auth/refresh",
      {},
      {
        headers: { "X-CSRF": csrf },
      }
    );

    document.cookie = `access_token=${res.data.accessToken}; path=/`;
    return res.data;
  }

  async logout(): Promise<void> {
    try {
      await plainAxios.post("/v1/auth/logout");
    } catch {
      // backend может уже считать сессию закрытой
    }

    document.cookie = "access_token=; Max-Age=0; path=/";
  }
}

export const authService = new AuthService();
