"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import styles from "./login.module.scss";
import Image from "next/image";
import BackgroundBlurs from "@/app/components/BackgroundBlurs";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuth, loading, error } = useAuthStore();
  const [active, setActive] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAuth) router.replace("/main");
  }, [isAuth, router]);

  const handleSwitch = (mode: "login" | "register") => {
    setActive(mode);
    localStorage.setItem("authMode", mode);
    router.push(`/${mode}`);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login({ email, password });
    router.replace("/main");
  };

  const GoogleLogin = () => {
    window.location.href =
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/oauth/google/login`;
  };

  return (
    <main className={styles.container}>
      {/* <BackgroundBlurs /> */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.logoContainer}>
          <Image src="/assets/logo.svg" width={64} height={64} alt="image" />
        </div>

        <div className={styles.top}>
          <h1 className={styles.title}>Платформа Анатомии Бизнеса</h1>
          <p className={styles.subtitle}>Диагностируйте и лечите ваш бизнес</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.toggleButtons}>
          <button
            type="button"
            className={active === "login" ? styles.active : ""}
            onClick={() => handleSwitch("login")}
          >
            Вход
          </button>
          <button
            type="button"
            className={active === "register" ? styles.active : ""}
            onClick={() => handleSwitch("register")}
          >
            Регистрация
          </button>
        </div>

        <label className={styles.label}>
          <span>Email:</span>
          <input
            type="email"
            value={email}
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className={styles.label}>
          <span>Password:</span>
          <input
            type="password"
            value={password}
            placeholder="Пароль"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={loading} className={styles.submitButton}>
          {loading ? "Входим..." : "Войти"}
        </button>

        <button
          type="button"
          className={styles.submitButton}
          onClick={GoogleLogin}
        >
          Войти через Google
        </button>
      </form>
    </main>
  );
}
