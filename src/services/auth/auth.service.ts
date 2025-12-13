// services/auth/auth.service.ts
import { api } from "@/lib/axios";

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
    const res = await api.post("/api/v1/auth/refresh");
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
