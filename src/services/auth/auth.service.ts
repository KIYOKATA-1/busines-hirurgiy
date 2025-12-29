import { plainAxios } from "@/lib/plainAxios";
import {
  ILoginRequest,
  ILoginResponse,
  IRegistRequest,
  IRegisterResponse,
  IRefreshResponse,
} from "./auth.types";

class AuthService {
  async register(payload: IRegistRequest): Promise<IRegisterResponse> {
    const res = await plainAxios.post<IRegisterResponse>("/api/v1/auth/register", payload);
    return res.data;
  }

  async login(payload: ILoginRequest): Promise<ILoginResponse> {
    const res = await plainAxios.post<ILoginResponse>("/api/v1/auth/login", payload);
    return res.data;
  }

  async refresh(): Promise<IRefreshResponse> {
    const res = await plainAxios.post<IRefreshResponse>("/api/v1/auth/refresh", {});
    return res.data;
  }

  async logout(): Promise<void> {
    try {
      await plainAxios.post("/api/v1/auth/logout");
    } catch {}
  }
}

export const authService = new AuthService();
