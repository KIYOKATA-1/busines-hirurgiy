import { api } from "@/lib/axios";
import { plainAxios } from "@/lib/plainAxios";
import { getCookie } from "@/utils/cookies";

export interface RegisterPayload {
  email: string;
  name: string;
  surname: string;
  password: string;
  role: "participant";
}

class AuthService {
  async login(payload: { email: string; password: string }) {
    await api.post("/api/v1/auth/login", payload);
  }

  async refresh() {
    const csrf = getCookie("csrf_token");

    if (!csrf) {
      throw new Error("CSRF token not found");
    }

    const res = await plainAxios.post(
      "/api/v1/auth/refresh",
      {},
      {
        headers: {
          "X-CSRF": csrf,
        },
      }
    );

    document.cookie = `access_token=${res.data.accessToken}; path=/`;
    return res.data; 
  }

  async register(payload: RegisterPayload) {
    await api.post("/api/v1/auth/register", payload);
  }

  logout() {
    document.cookie = "access_token=; Max-Age=0; path=/";
    window.location.href = "/login";
  }
}

export const authService = new AuthService();
