"use client";

import { FormEvent, useState } from "react";
import { useAuthStore } from "@/store/auth.store";

export default function LoginPage() {
  const { login, loading, error, isAuth, user } = useAuthStore();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await login({ email, password });
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        backgroundColor: "#0c1020",
        color: "#fff",
        padding: "24px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "360px",
          backgroundColor: "#1a1f35",
          borderRadius: "16px",
          padding: "24px",
          display: "grid",
          gap: "16px",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.7), 0 2px 4px rgba(255,255,255,0.05) inset",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>
          Sign in
        </h1>

        {isAuth && (
          <div
            style={{
              backgroundColor: "#0f3",
              color: "#000",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            Logged in as {user?.fullName ?? user?.email ?? "user"}
          </div>
        )}

        {error && (
          <div
            style={{
              backgroundColor: "#3a0000",
              color: "#ff6b6b",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <label style={{ display: "grid", gap: "6px", fontSize: "0.9rem" }}>
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              backgroundColor: "#0f1325",
              border: "1px solid #2a2f4a",
              color: "#fff",
              borderRadius: "8px",
              padding: "10px 12px",
              fontSize: "0.9rem",
              outline: "none",
            }}
            type="email"
            required
          />
        </label>

        <label style={{ display: "grid", gap: "6px", fontSize: "0.9rem" }}>
          <span>Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              backgroundColor: "#0f1325",
              border: "1px solid #2a2f4a",
              color: "#fff",
              borderRadius: "8px",
              padding: "10px 12px",
              fontSize: "0.9rem",
              outline: "none",
            }}
            type="password"
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            background:
              "linear-gradient(90deg,#4b6bff 0%,#9f4bff 50%,#ff4b8a 100%)",
            border: "0",
            borderRadius: "10px",
            padding: "10px 12px",
            fontWeight: 600,
            fontSize: "0.95rem",
            cursor: "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
