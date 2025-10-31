import axios, { AxiosError, AxiosInstance } from "axios";
import { getCookie, setCookie } from "@/utils/cookies";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

class ApiClient {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private refreshQueue: Array<(token: string | null) => void> = [];

  constructor() {
    this.instance = axios.create({
      baseURL: BASE_URL,
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });

    this.instance.interceptors.request.use((config) => {
      const access = getCookie("access_token");
      if (access && config.headers) {
        config.headers.Authorization = `Bearer ${access}`;
      }
      return config;
    });

    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        if (!originalRequest || error.response?.status !== 401) {
          return Promise.reject(error);
        }

        if (this.isRefreshing) {
          return new Promise((resolve) => {
            this.refreshQueue.push(resolve);
          });
        }

        this.isRefreshing = true;
        try {
          const csrf = getCookie("csrf_token");
          const resp = await this.instance.post(
            `/api/v1/auth/login/refresh`,
            { refreshToken: "" },
            { headers: csrf ? { "X-CSRF": csrf } : {} }
          );

          const newAccess = (resp.data as { accessToken: string }).accessToken;
          setCookie("access_token", newAccess, 1);

          this.refreshQueue.forEach((cb) => cb(`Bearer ${newAccess}`));
          this.refreshQueue = [];

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          }

          return this.instance(originalRequest);
        } catch (refreshErr) {
          this.refreshQueue.forEach((cb) => cb(null));
          this.refreshQueue = [];
          return Promise.reject(refreshErr);
        } finally {
          this.isRefreshing = false;
        }
      }
    );
  }

  public getInstance() {
    return this.instance;
  }
}

export const api = new ApiClient().getInstance();
