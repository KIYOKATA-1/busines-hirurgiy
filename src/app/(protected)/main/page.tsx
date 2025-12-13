"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

export default function MainPage() {
  const { isAuth, loading, user, logout, init } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!loading && !isAuth) {
      router.replace("/login");
    }
  }, [loading, isAuth, router]);

  if (loading) return <p>Загрузка...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>MAIN</h1>
      <pre>{JSON.stringify(user, null, 2)}</pre>
      <button onClick={logout}>Выйти</button>
    </div>
  );
}
