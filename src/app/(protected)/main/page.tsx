"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import Header from "@/app/components/Header/Header";
import styles from "./main.module.scss";

type TabKey = "anatomy" | "progress" | "diary";

const TABS: { key: TabKey; label: string }[] = [
  { key: "anatomy", label: "Анатомия Бизнеса" },
  { key: "progress", label: "Мой Прогресс" },
  { key: "diary", label: "Дневник Активности" },
];

export default function MainPage() {
  const router = useRouter();
  const { initialized, loading, isAuth, logout, user } = useSession();

  const [activeTab, setActiveTab] = useState<TabKey>("anatomy");

  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    anatomy: null,
    progress: null,
    diary: null,
  });

  const moveIndicator = useCallback(() => {
    const activeEl = tabRefs.current[activeTab];
    const indicator = indicatorRef.current;
    const container = containerRef.current;

    if (!activeEl || !indicator || !container) return;

    const tabRect = activeEl.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    indicator.style.width = `${tabRect.width}px`;
    indicator.style.transform = `translateX(${tabRect.left - containerRect.left}px)`;
  }, [activeTab]);

  /* 🔑 ставим bg при первом рендере */
  useLayoutEffect(() => {
    moveIndicator();
  }, [moveIndicator]);

  /* 🔑 переставляем при resize */
  useEffect(() => {
    window.addEventListener("resize", moveIndicator);
    return () => window.removeEventListener("resize", moveIndicator);
  }, [moveIndicator]);

  /* auth guard */
  useEffect(() => {
    if (!initialized) return;
    if (!isAuth) router.replace("/login");
  }, [initialized, isAuth, router]);

  if (!initialized || loading) {
    return (
      <div className={styles.loader}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header user={user ?? null} onLogout={logout} />

      <main className={styles.main}>
        <section ref={containerRef} className={styles.tablet}>
          {/* sliding bg */}
          <div ref={indicatorRef} className={styles.indicator} />

          {TABS.map((tab) => (
            <button
              key={tab.key}
              ref={(el) => {
                tabRefs.current[tab.key] = el;
              }}
              className={`${styles.tab} ${
                activeTab === tab.key ? styles.active : ""
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </section>
      </main>
    </div>
  );
}
