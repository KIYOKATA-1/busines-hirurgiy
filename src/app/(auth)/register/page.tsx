"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "../login/login.module.scss";
import Image from "next/image";
import BackgroundBlurs from "@/app/components/BackgroundBlurs";
import { useAuthStore } from "@/store/auth.store";

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading, error } = useAuthStore();
  const [active, setActive] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSwitch = (mode: "login" | "register") => {
    setActive(mode);
    router.push(`/${mode}`);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError("Пароли не совпадают");
      return;
    }

    try {
      await register({
        email,
        name,
        surname,
        password,
        role: "participant",
      });

      alert("Регистрация прошла успешно!");
      router.push("/login");
    } catch {
      // ошибка уже в store.error
    }
  };

  return (
    <main className={styles.container}>
      <BackgroundBlurs />

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.logoContainer}>
          <Image src="/assets/logo.svg" width={64} height={64} alt="Logo" />
        </div>

        <div className={styles.top}>
          <h1 className={styles.title}>Регистрация</h1>
          <p className={styles.subtitle}>Создайте аккаунт и начните работу</p>
        </div>

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

        <div className={styles.userInfo}>
          <label className={styles.label}>
            <span>Имя</span>
            <input
              type="text"
              placeholder="Ваше Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className={styles.label}>
            <span>Фамилия</span>
            <input
              type="text"
              placeholder="Ваша Фамилия"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              required
            />
          </label>
        </div>

        <label className={styles.label}>
          <span>Email</span>
          <input
            type="email"
            placeholder="Введите email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className={styles.label}>
          <span>Пароль</span>
          <input
            type="password"
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <label className={styles.label}>
          <span>Подтвердите пароль</span>
          <input
            type="password"
            placeholder="Подтвердите пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </label>

        {(localError || error) && (
          <p className={styles.error}>{localError || error}</p>
        )}

        <button
          type="submit"
          className={styles.submitButton}
          disabled={loading}
        >
          {loading ? "Регистрация..." : "Зарегистрироваться"}
        </button>
      </form>
    </main>
  );
}
