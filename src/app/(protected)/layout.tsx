"use client";

import React from "react";
import MinWidthGuard from "@/app/components/MinWidthGuard/MinWidthGuard";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <MinWidthGuard minWidth={768}>{children}</MinWidthGuard>;
}
