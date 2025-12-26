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
import BusinessAnatomy from "./components/BusinessAnatomy/BusinessAnatomy";
import MyProgress from "./components/MyProgress/MyProgress";
import ActivityDiary from "./components/ActivityDiary/ActivityDiary";
import styles from "./main.module.scss";
import {
  BusinesAnatomyIcon,
  MyProgressIcon,
  ActivityDiaryIcon,
} from "@/app/components/icons";

type TabKey = "anatomy" | "progress" | "diary";

const TABS: {
  key: TabKey;
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}[] = [
  {
    key: "anatomy",
    label: "Анатомия Бизнеса",
    icon: BusinesAnatomyIcon,
  },
  {
    key: "progress",
    label: "Мой Прогресс",
    icon: MyProgressIcon,
  },
  {
    key: "diary",
    label: "Дневник Активности",
    icon: ActivityDiaryIcon,
  },
];

export default function MainPage() {
  const router = useRouter();
  const { initialized, loading, isAuth, logout, user } = useSession();

  const [activeTab, setActiveTab] = useState<TabKey>("anatomy");

  const tabletRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    anatomy: null,
    progress: null,
    diary: null,
  });

  const moveIndicator = useCallback(() => {
    const activeEl = tabRefs.current[activeTab];
    const indicator = indicatorRef.current;
    const tablet = tabletRef.current;

    if (!activeEl || !indicator || !tablet) return;

    const tabRect = activeEl.getBoundingClientRect();
    const tabletRect = tablet.getBoundingClientRect();

    indicator.style.width = `${tabRect.width}px`;
    indicator.style.transform = `translateX(${tabRect.left - tabletRect.left}px)`;
  }, [activeTab]);

  useLayoutEffect(() => {
    if (!initialized || loading) return;

    requestAnimationFrame(() => {
      moveIndicator();
    });
  }, [initialized, loading, activeTab, moveIndicator]);

  useEffect(() => {
    if (!initialized || loading) return;

    const onResize = () => moveIndicator();
    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, [initialized, loading, moveIndicator]);

  useEffect(() => {
    if (!initialized) return;
    if (!isAuth) router.replace("/login");
  }, [initialized, isAuth, router]);

  if (!initialized || loading) {
    return (
      <div className={styles.loader}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header user={user ?? null} onLogout={logout} />

      <main className={styles.main}>
        <div className={styles.container}>
          <section className={styles.tabletWrap}>
            <div ref={tabletRef} className={styles.tablet}>
              <div ref={indicatorRef} className={styles.indicator} />

              {TABS.map((tab) => {
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.key}
                    ref={(el) => {
                      tabRefs.current[tab.key] = el;
                    }}
                    className={`${styles.tab} ${
                      activeTab === tab.key ? styles.active : ""
                    }`}
                    onClick={() => setActiveTab(tab.key)}
                    type="button"
                  >
                    <Icon className={styles.tabIcon} width={16} height={16} />
                    <span className={styles.tabLabel}>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={styles.content}>
            {activeTab === "anatomy" && <BusinessAnatomy />}
            {activeTab === "progress" && <MyProgress />}
            {activeTab === "diary" && <ActivityDiary />}
          </section>
        </div>
      </main>
    </div>
  );
}
