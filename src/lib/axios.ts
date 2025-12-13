import axios, { AxiosError } from "axios";
import { getCookie } from "@/utils/cookies";
import { authService } from "@/services/auth/auth.service";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getCookie("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config;
    if (error.response?.status !== 401 || !original) {
      return Promise.reject(error);
    }

    try {
      await authService.refresh();
      const token = getCookie("access_token");
      if (token && original.headers) {
        original.headers.Authorization = `Bearer ${token}`;
      }
      return api(original);
    } catch {
      window.location.href = "/login";
      return Promise.reject(error);
    }
  }
);
