"use client";

import { plainAxios } from "@/lib/plainAxios";

export default function GoogleRedirectButton() {
  const handleGoogleLogin = async () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/oauth/google/login`;
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      style={{
        width: "100%",
        marginTop: 12,
        padding: "10px",
        borderRadius: 6,
        border: "1px solid #ddd",
        background: "#fff",
        cursor: "pointer",
        fontWeight: 500,
      }}
    >
      Войти через Google
    </button>
  );
}
