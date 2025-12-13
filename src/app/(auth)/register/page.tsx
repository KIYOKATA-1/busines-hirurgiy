"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import Image from "next/image";
import styles from "../styles/auth.module.scss";

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading, error } = useAuthStore();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== confirm) {
      alert("Пароли не совпадают");
      return;
    }

    await register({
      email,
      name,
      surname,
      password,
      role: "participant",
    });

    alert("Регистрация успешна");
    router.replace("/login");
  };

  return (
    <main className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.logoContainer}>
          <Image src="/assets/logo.svg" alt="Logo" width={32} height={32} />
        </div>

        <div className={styles.title}>Платформа Анатомии Бизнеса</div>
        <div className={styles.subtitle}>
          Диагностируйте и лечите ваш бизнес
        </div>
        {error && <p>{error}</p>}
        <label className={styles.label}>
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className={styles.label}>
          <span>Имя</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className={styles.label}>
          <span>Фамилия</span>
          <input
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
          />
        </label>
        <label className={styles.label}>
          <span>Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label className={styles.label}>
          <span>Повторите Пароль</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>

        <button disabled={loading} className={styles.submitButton}>
          {loading ? "..." : "Зарегистрироваться"}
        </button>
      </form>
    </main>
  );
}
