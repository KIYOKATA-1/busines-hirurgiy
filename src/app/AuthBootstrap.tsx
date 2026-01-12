"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";

export default function AuthBootstrap({
  children,
}: {
  children: React.ReactNode;
}) {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return <>{children}</>;
}
