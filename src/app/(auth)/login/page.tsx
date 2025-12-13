"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import styles from "./login.module.scss";

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
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <p>{error}</p>}
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button disabled={loading}>{loading ? "..." : "Войти"}</button>
    </form>
  );
}
