import { api } from "@/lib/axios";
import { setCookie, deleteCookie } from "@/utils/cookies";
import {
  ILoginRequest,
  ILoginResponse,
  IRefreshResponse,
  IRegistRequest,
  IRegisterResponse,
} from "./auth.types";

class AuthService {
  async login(payload: ILoginRequest): Promise<ILoginResponse> {
    const res = await api.post<ILoginResponse>("/api/v1/auth/login", payload);
    setCookie("access_token", res.data.accessToken, 1);
    return res.data;
  }

  async refresh(): Promise<IRefreshResponse> {
    const res = await api.post<IRefreshResponse>("/api/v1/auth/refresh");
    setCookie("access_token", res.data.accessToken, 1);
    return res.data;
  }

  async register(payload: IRegistRequest): Promise<IRegisterResponse> {
    const res = await api.post<IRegisterResponse>("/api/v1/auth/register", payload);
    return res.data;
  }

  logout() {
    deleteCookie("access_token");
  }
}

export const authService = new AuthService();
