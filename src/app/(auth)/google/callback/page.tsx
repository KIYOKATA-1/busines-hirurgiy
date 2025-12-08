"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import { setCookie } from "@/utils/cookies";
import { useAuthStore } from "@/store/auth.store";

export default function GoogleCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { init, loading } = useAuthStore();

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");

    if (!code) {
      router.replace("/login");
      return;
    }

    const processGoogleLogin = async () => {
      try {
        const res = await api.get("/api/v1/auth/oauth/google/callback", {
          params: { code, state },
        });

        const { accessToken, csrfToken, user } = res.data;

        if (!accessToken) {
          router.replace("/login");
          return;
        }

        setCookie("access_token", accessToken, 1);
        if (csrfToken) setCookie("csrf_token", csrfToken, 1);

        await init();

        router.replace("/main");
      } catch (err) {
        console.error("Google OAuth error:", err);
        router.replace("/login");
      }
    };

    processGoogleLogin();
  }, [params, init, router]);

  return <p style={{ padding: 20 }}>Выполняется вход через Google...</p>;
}
