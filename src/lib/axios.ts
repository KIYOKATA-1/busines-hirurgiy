import axios, { AxiosError } from "axios";
import { authService } from "@/services/auth/auth.service";
import { useAuthStore } from "@/store/auth.store";

export const api = axios.create({
  baseURL: "",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;

let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  failedQueue = [];
};

const isAuthEndpoint = (url?: string) => {
  if (!url) return false;
  return (
    url.includes("/api/v1/auth/refresh") ||
    url.includes("/api/v1/auth/login") ||
    url.includes("/api/v1/auth/logout") ||
    url.includes("/api/v1/auth/register") ||
    url.includes("/api/v1/auth/oauth") ||
    url.includes("/api/v1/me") 
  );
};

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original: any = error.config;

    if (!original) return Promise.reject(error);
    if (error.response?.status !== 401) return Promise.reject(error);

    if (isAuthEndpoint(original.url)) return Promise.reject(error);

    if (original._retry) return Promise.reject(error);
    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => api(original));
    }

    isRefreshing = true;

    try {
      const refreshed = await authService.refresh();
      if (refreshed?.accessToken) {
        useAuthStore.getState().setAccessToken(refreshed.accessToken);
      }

      processQueue(null);
      return api(original);
    } catch (e) {
      processQueue(e);

      await authService.logout();
      useAuthStore.getState().clearSession();

      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }

      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);
