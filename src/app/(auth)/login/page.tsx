"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useAuthStore } from "@/store/auth.store";
import styles from "./login.module.scss";

export default function LoginPage() {
  const { login, loading, error, isAuth, user } = useAuthStore();
    const [active, setActive] = useState<"login" | "register">("login");


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await login({ email, password });
  };

  return (
    <main className={styles.container}>
      <div className={styles.blurLayer}>
        <Image
          src="/assets/blurs/blue.svg"
          alt="Blue glow"
          width={400}
          height={400}
          className={styles.blue}
          priority
        />
        <Image
          src="/assets/blurs/purple.svg"
          alt="Purple glow"
          width={480}
          height={480}
          className={styles.purple}
          priority
        />
        <Image
          src="/assets/blurs/cyan.svg"
          alt="Cyan glow"
          width={420}
          height={420}
          className={styles.cyan}
          priority
        />
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.logoContainer}>
          <Image
            src="/assets/logo.svg"
            alt="Logo"
            width={40}
            height={40}
            className={styles.logo}
            priority
          />
        </div>

        <h2 className={styles.title}>Платформа Анатомии Бизнеса</h2>
        <p className={styles.subtitle}>Диагностируйте и лечите ваш бизнес</p>

        {isAuth && (
          <div className={styles.success}>
            Вошли как {user?.fullName ?? user?.email ?? "пользователь"}
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.toggleButtons}>
          <button className={active === 'login' ? styles.active : ""} onClick={() =>setActive("login")}>Вход</button>
          <button className={active === 'register' ? styles.active : ""} onClick={() => setActive("register")}>Регистрация</button>
        </div>

        <label className={styles.label}>
          <span>Email</span>
          <input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className={styles.label}>
          <span>Пароль</span>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? "Вход..." : "Войти"}
        </button>
      </form>
    </main>
  );
}
