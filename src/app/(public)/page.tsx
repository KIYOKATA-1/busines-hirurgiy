"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import styles from "./LandingPage.module.scss";

export default function LandingPage() {
  const router = useRouter();
  const { initialized, loading, isAuth } = useSession();

  useEffect(() => {
    if (!initialized || loading) return;

    if (isAuth) {
      router.replace("/main");
    }
  }, [initialized, loading, isAuth, router]);

  if (!initialized || loading) {
    return null; 
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
