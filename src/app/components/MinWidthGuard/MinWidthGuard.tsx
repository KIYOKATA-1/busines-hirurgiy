"use client";

import { useEffect, useState } from "react";

type Props = {
  minWidth: number;
  children: React.ReactNode;
};

export default function MinWidthGuard({ minWidth, children }: Props) {
  const [ok, setOk] = useState(true);

  useEffect(() => {
    const onResize = () => setOk(window.innerWidth >= minWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [minWidth]);

  if (!ok) {
    return (
      <div style={{ padding: 24 }}>
        Экран слишком маленький. Минимальная ширина: {minWidth}px
      </div>
    );
  }

  return <>{children}</>;
}
