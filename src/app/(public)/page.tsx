"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./LandingPage.module.scss";

import { authService } from "@/services/auth/auth.service";

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      try {
        const token = authService.getAccessToken();

        if (token) {
          router.replace("/main");
          return;
        }

        await authService.refresh();

        router.replace("/main");
      } catch {
        console.log("Не авторизован, остаёмся на лендинге");
      } finally {
        setChecking(false);
      }
    }

    verifyAuth();
  }, [router]);

  if (checking) {
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
