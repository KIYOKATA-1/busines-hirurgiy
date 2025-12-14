"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
      {user && (
        <p style={{color: 'green'}}>
          Привет, {user.name} {user.surname} ({user.email})
        </p>
      )}
      <Image
        src="/assets/plug.jpg"
        alt="Plug"
        width={300}
        height={300}
        priority
      />
      <button onClick={logout}>Выйти</button>
    </div>
  );
}
