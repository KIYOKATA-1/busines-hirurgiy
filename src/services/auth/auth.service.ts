import { plainAxios } from "@/lib/plainAxios";
import { getCookie } from "@/utils/cookies";

export interface RegisterPayload {
  email: string;
  name: string;
  surname: string;
  password: string;
  role: "participant";
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    surname: string;
    role: string;
  };
}

class AuthService {
  async register(payload: RegisterPayload) {
    const res = await plainAxios.post(
      "/v1/auth/register",
      payload
    );
    return res.data;
  }

  async login(payload: { email: string; password: string }): Promise<LoginResponse> {
    const res = await plainAxios.post<LoginResponse>(
      "/v1/auth/login",
      payload
    );

    document.cookie = `access_token=${res.data.accessToken}; path=/`;
    return res.data;
  }

  async refresh() {
    const csrf = getCookie("csrf_token");
    if (!csrf) throw new Error("No CSRF");

    const res = await plainAxios.post(
      "/v1/auth/refresh",
      {},
      { headers: { "X-CSRF": csrf } }
    );

    document.cookie = `access_token=${res.data.accessToken}; path=/`;
    return res.data;
  }

  logout() {
    document.cookie = "access_token=; Max-Age=0; path=/";
    window.location.href = "/login";
  }
}

export const authService = new AuthService();
