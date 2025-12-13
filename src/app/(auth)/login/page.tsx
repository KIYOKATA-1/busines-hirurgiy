"use client";

import Image from "next/image";
import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import styles from "../styles/auth.module.scss";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuth, loading, error } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAuth) router.replace("/main");
  }, [isAuth, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

  return (
    <main className={styles.container}>
      <div className={styles.blurLayer}>
        <Image src="/assets/blue.png" alt="" fill className={styles.blue} />
        <Image src="/assets/purple.png" alt="" fill className={styles.purple} />
        <Image src="/assets/cyan.png" alt="" fill className={styles.cyan} />
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.logoContainer}>
          <Image src="/assets/logo.svg" alt="Logo" width={32} height={32} />
        </div>

        <div className={styles.title}>Платформа Анатомии Бизнеса</div>
        <div className={styles.subtitle}>
          Диагностируйте и лечите ваш бизнес
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <label className={styles.label}>
          <span>Email</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label className={styles.label}>
          <span>Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button className={styles.submitButton} disabled={loading}>
          {loading ? "Входим..." : "Войти"}
        </button>
      </form>
    </main>
  );
}
