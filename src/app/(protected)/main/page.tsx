"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/store/auth.store";

import plugImage from "@/assets/plug.jpg";

export default function MainPage() {
  const router = useRouter();
  const { init, isAuth, initialized, loading, logout } = useAuthStore();

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

      <Image
        src={plugImage}
        alt="Plug image"
        width={300}
        height={300}
        priority
      />

      <br />

      <button onClick={logout}>Выйти</button>
    </div>
  );
}
