import axios, { AxiosError } from "axios";
import { getCookie } from "@/utils/cookies";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, 
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getCookie("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config;

    if (error.response?.status !== 401 || !original) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push((token) => {
          if (!token) reject(error);
          if (original.headers) {
            original.headers.Authorization = token!;
          }
          resolve(api(original));
        });
      });
    }

    isRefreshing = true;

    try {
      const csrf = getCookie("csrf_token");

      const resp = await api.post(
        "/api/v1/auth/refresh",
        {},
        {
          headers: csrf ? { "X-CSRF": csrf } : {},
        }
      );

      const accessToken = (resp.data as { accessToken: string }).accessToken;

      document.cookie = `access_token=${accessToken}; path=/`;

      queue.forEach((cb) => cb(`Bearer ${accessToken}`));
      queue = [];

      if (original.headers) {
        original.headers.Authorization = `Bearer ${accessToken}`;
      }

      return api(original);
    } catch (e) {
      queue.forEach((cb) => cb(null));
      queue = [];
      window.location.href = "/login";
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);
