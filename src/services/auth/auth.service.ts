import {
  ILoginRequest,
  ILoginResponse,
  IRefreshRequest,
  IRefreshResponse,
} from "./auth.types";

import { getCookie } from "@/utils/cookies";
import { tokenManager } from "./tokenManager";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export class AuthService {
  public static async login(payload: ILoginRequest): Promise<ILoginResponse> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      credentials: "include", 
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Invalid email or password");
    }

    const data = (await res.json()) as ILoginResponse;

    tokenManager.setAccessToken(data.accessToken);

    return data;
  }

  public static async refresh(): Promise<IRefreshResponse> {
    const csrfToken = getCookie("csrf_token"); 
    const refreshTokenFromCookie = getCookie("refresh_token"); 

    const body: IRefreshRequest = {
      refreshToken: refreshTokenFromCookie ?? "",
    };

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF": csrfToken ?? "",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      tokenManager.clear();
      throw new Error("Unable to refresh token");
    }

    const data = (await res.json()) as IRefreshResponse;

    tokenManager.setAccessToken(data.accessToken);

    return data;
  }

  public static async logout(): Promise<void> {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    tokenManager.clear();
  }
}
