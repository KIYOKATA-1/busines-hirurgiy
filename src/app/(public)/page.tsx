"use client";

import Link from "next/link";
import styles from "./LandingPage.module.scss";

export default function LandingPage() {
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
