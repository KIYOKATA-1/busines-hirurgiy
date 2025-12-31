"use client";

import React from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import ScreenTooSmall from "@/app/components/ScreenTooSmall/ScreenTooSmall";

type Props = {
  minWidth: number;
  children: React.ReactNode;
};

export default function MinWidthGuard({ minWidth, children }: Props) {
  const isTooSmall = useMediaQuery(`(max-width: ${minWidth - 1}px)`);

  if (isTooSmall) return <ScreenTooSmall minWidth={minWidth} />;
  return <>{children}</>;
}
