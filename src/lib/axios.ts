import axios, { AxiosError, AxiosInstance } from "axios";
import { getCookie, setCookie, deleteCookie } from "@/utils/cookies";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

class ApiClient {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private queue: Array<(token: string | null) => void> = [];

  constructor() {
    this.instance = axios.create({
      baseURL: BASE_URL,
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });

    this.instance.interceptors.request.use((config) => {
      const token = getCookie("access_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.instance.interceptors.response.use(
      (res) => res,
      async (error: AxiosError) => {
        const original = error.config;
        if (!original || error.response?.status !== 401) {
          return Promise.reject(error);
        }

        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.queue.push((token) => {
              if (!token) reject(error);
              if (original.headers) {
                original.headers.Authorization = token!;
              }
              resolve(this.instance(original));
            });
          });
        }

        this.isRefreshing = true;

        try {
          const resp = await this.instance.post("/api/v1/auth/refresh");
          const newToken = (resp.data as { accessToken: string }).accessToken;

          setCookie("access_token", newToken, 1);

          this.queue.forEach((cb) => cb(`Bearer ${newToken}`));
          this.queue = [];

          if (original.headers) {
            original.headers.Authorization = `Bearer ${newToken}`;
          }

          return this.instance(original);
        } catch {
          this.queue.forEach((cb) => cb(null));
          this.queue = [];
          deleteCookie("access_token");
          window.location.href = "/login";
          return Promise.reject(error);
        } finally {
          this.isRefreshing = false;
        }
      }
    );
  }

  get() {
    return this.instance;
  }
}

export const api = new ApiClient().get();
