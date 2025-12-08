"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth/auth.service";
import { useAuthStore } from "@/store/auth.store";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { init } = useAuthStore();

  useEffect(() => {
    const url = new URL(window.location.href);

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code) {
      router.replace("/login");
      return;
    }

    const handle = async () => {
      try {
        await authService.loginWithGoogle(code, state ?? undefined);

        await init();

        router.replace("/main");
      } catch (err) {
        console.error("Google OAuth error:", err);
        router.replace("/login");
      }
    };

    handle();
  }, [router, init]);

  return <p>Вход через Google...</p>;
}
