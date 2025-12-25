import { plainAxios } from "@/lib/plainAxios";

export default function GoogleRedirectButton() {
  const handleGoogleLogin = async () => {
    await plainAxios.get("/api/v1/auth/csrf");

    window.location.href =
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google`;
  };

  return (
    <button type="button" onClick={handleGoogleLogin}>
      Войти через Google
    </button>
  );
}
