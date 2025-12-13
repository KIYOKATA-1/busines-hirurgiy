"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

export default function MainPage() {
  const router = useRouter();
  const { init, isAuth, initialized, loading, logout, user } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!initialized) return;

    if (!isAuth) {
      router.replace("/login");
    }
  }, [initialized, isAuth, router]);

  if (!initialized || loading) {
    return <p>Загрузка...</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>MAIN</h1>
      <pre>{JSON.stringify(user, null, 2)}</pre>
      <button onClick={logout}>Выйти</button>
    </div>
  );
}
