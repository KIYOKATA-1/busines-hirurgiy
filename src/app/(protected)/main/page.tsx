"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

export default function MainPage() {
  const { isAuth, loading, user, logout, init } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    void init();
  }, [init]);

  useEffect(() => {
    if (hydrated && !loading && !isAuth) {
      router.replace("/login");
    }
  }, [hydrated, loading, isAuth, router]);

  if (!hydrated || loading) {
    return <p>Загрузка...</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Привет, {user?.email || "Пользователь"}!</h1>
      <button onClick={logout}>Выйти</button>
    </div>
  );
}
