import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { AuthService } from "@/services/auth/auth.service";
import { tokenManager } from "./auth/tokenManager";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

class ApiClient {
  private static instance: AxiosInstance | null = null;

  private static isRefreshing = false;
  private static refreshQueue: Array<() => void> = [];

  public static getInstance(): AxiosInstance {
    if (!ApiClient.instance) {
      const api = axios.create({
        baseURL: BASE_URL,
        withCredentials: true, 
      });

      api.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
          const token = tokenManager.getAccessToken();
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        }
      );

      api.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
          const originalRequest = error.config;

          if (!originalRequest) {
            return Promise.reject(error);
          }

          if (error.response?.status === 401) {
            if (ApiClient.isRefreshing) {
              return new Promise((resolve, reject) => {
                ApiClient.refreshQueue.push(async () => {
                  try {
                    const newToken = tokenManager.getAccessToken();
                    if (newToken && originalRequest.headers) {
                      originalRequest.headers["Authorization"] =
                        `Bearer ${newToken}`;
                    }
                    const retryResponse = await api.request(originalRequest);
                    resolve(retryResponse);
                  } catch (errRetry) {
                    reject(errRetry);
                  }
                });
              });
            }

            ApiClient.isRefreshing = true;

            try {
              await AuthService.refresh();

              ApiClient.refreshQueue.forEach((cb) => cb());
              ApiClient.refreshQueue = [];

              const newToken = tokenManager.getAccessToken();
              if (newToken && originalRequest.headers) {
                originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
              }

              return api.request(originalRequest);
            } catch (refreshErr) {
              tokenManager.clear();
              ApiClient.refreshQueue = [];
              return Promise.reject(refreshErr);
            } finally {
              ApiClient.isRefreshing = false;
            }
          }

          return Promise.reject(error);
        }
      );

      ApiClient.instance = api;
    }

    return ApiClient.instance;
  }
}

export const api = ApiClient.getInstance();
