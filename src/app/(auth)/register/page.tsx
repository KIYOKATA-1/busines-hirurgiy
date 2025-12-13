"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

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
    <form onSubmit={handleSubmit}>
      {error && <p>{error}</p>}
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="Фамилия" value={surname} onChange={(e) => setSurname(e.target.value)} />
      <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} />
      <input type="password" placeholder="Повтор пароля" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      <button disabled={loading}>{loading ? "..." : "Зарегистрироваться"}</button>
    </form>
  );
}
