"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import AuthScreen from "../(auth)/components/AuthScreen";

export default function LandingPage() {
  const router = useRouter();
  const { initialized, loading, isAuth } = useSession();

  useEffect(() => {
    if (!initialized || loading) return;
    if (isAuth) router.replace("/main");
  }, [initialized, loading, isAuth, router]);

  if (!initialized || loading) return null;

  return <AuthScreen initialMode="login" syncUrl={false} />;
}
