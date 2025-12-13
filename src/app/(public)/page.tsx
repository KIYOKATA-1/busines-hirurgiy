"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./LandingPage.module.scss";
import { useAuthStore } from "@/store/auth.store";

export default function LandingPage() {
  const router = useRouter();
  const { init, isAuth, loading } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!loading && isAuth) {
      router.replace("/main");
    }
  }, [loading, isAuth, router]);

  if (loading) {
    return (
      <main className={styles.container}>
        <h1 className={styles.title}>Проверяем сессию...</h1>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Добро пожаловать в MyApp</h1>
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <Link href="/login">Войти</Link>
        <Link href="/register">Регистрация</Link>
      </div>
    </main>
  );
}
