"use client";

export default function GoogleRedirectButton() {
  const handleGoogleLogin = () => {
    window.location.href =
      "/api/v1/auth/oauth/google/login";
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
        color: "#000",
        background: "#fff",
        cursor: "pointer",
        fontWeight: 500,
      }}
    >
      Войти через Google
    </button>
  );
}
