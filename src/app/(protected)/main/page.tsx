"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "@/hooks/useSession";

export default function MainPage() {
  const router = useRouter();
  const { initialized, loading, isAuth, user, logout } = useSession();

  useEffect(() => {
    if (!initialized) return;
    if (!isAuth) router.replace("/login");
  }, [initialized, isAuth, router]);

  if (!initialized || loading) {
    return <p>Загрузка...</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>MAIN</h1>

      {user && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: "green" }}>
            Привет, <b>{user.name} {user.surname}</b>
          </p>

          <div style={{ marginTop: 10, lineHeight: 1.6 }}>
            <div><b>ID:</b> {user.id}</div>
            <div><b>Email:</b> {user.email}</div>
            <div><b>Role:</b> {user.role}</div>
            <div><b>Created:</b> {user.createdAt}</div>
            <div><b>Updated:</b> {user.updatedAt}</div>
          </div>
        </div>
      )}

      <Image src="/assets/plug.jpg" alt="Plug" width={300} height={300} priority />

      <button onClick={logout} style={{ marginTop: 16 }}>
        Выйти
      </button>
    </div>
  );
}
