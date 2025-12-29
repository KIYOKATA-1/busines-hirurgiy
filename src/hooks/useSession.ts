"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";

export function useSession() {
  const { init, initialized, loading, isAuth, user, error, logout } = useAuthStore();

  useEffect(() => {
    if (!initialized) init();
  }, [initialized, init]);

  return { initialized, loading, isAuth, user, error, logout };
}
