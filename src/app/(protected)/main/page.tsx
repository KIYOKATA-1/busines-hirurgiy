"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";

import Header from "@/app/components/Header/Header";
import { Tablet, Role, TabKey } from "@/app/components/Tablet/Tablet";

import BusinessAnatomy from "./components/BusinessAnatomy/BusinessAnatomy";
import MyProgress from "./components/MyProgress/MyProgress";
import ActivityDiary from "./components/ActivityDiary/ActivityDiary";
import DiseaseLibrary from "./components/DiseaseLibrary/DiseaseLibrary";
import Participants from "./components/Participants/Participants";

import {
  BusinesAnatomyIcon,
  MyProgressIcon,
  ActivityDiaryIcon,
  DiseaseLibraryIcon,
  ParticipantsIcon,
} from "@/app/components/icons";

import styles from "./main.module.scss";

export default function MainPage() {
  const router = useRouter();
  const { initialized, loading, isAuth, logout, user } = useSession();

  const role: Role =
    user?.role === "admin" || user?.role === "moderator"
      ? user.role
      : "participant";

  const tabsByRole: Record<Role, readonly {
    key: TabKey;
    label: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
  }[]> = {
    participant: [
      { key: "anatomy", label: "Анатомия Бизнеса", icon: BusinesAnatomyIcon },
      { key: "progress", label: "Мой Прогресс", icon: MyProgressIcon },
      { key: "diary", label: "Дневник Активности", icon: ActivityDiaryIcon },
    ],
    moderator: [
      { key: "anatomy", label: "Анатомия Бизнеса", icon: BusinesAnatomyIcon },
      { key: "library", label: "Библиотека Болезней", icon: DiseaseLibraryIcon },
      { key: "participants", label: "Участники", icon: ParticipantsIcon },
    ],
    admin: [
      { key: "anatomy", label: "Анатомия Бизнеса", icon: BusinesAnatomyIcon },
      { key: "library", label: "Библиотека Болезней", icon: DiseaseLibraryIcon },
      { key: "participants", label: "Участники", icon: ParticipantsIcon },
    ],
  };

  const availableTabs = tabsByRole[role];
  const [tab, setTab] = useState<TabKey>(availableTabs[0].key);

  useEffect(() => {
    if (!availableTabs.some((t) => t.key === tab)) {
      setTab(availableTabs[0].key);
    }
  }, [role]);

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
          <Tablet
            role={role}
            tabsByRole={tabsByRole}
            value={tab}
            onChange={setTab}
          />

          <section className={styles.content}>
            {tab === "anatomy" && <BusinessAnatomy />}
            {tab === "progress" && <MyProgress />}
            {tab === "diary" && <ActivityDiary />}
            {tab === "library" && <DiseaseLibrary />}
            {tab === "participants" && <Participants />}
          </section>
        </div>
      </main>
    </div>
  );
}
