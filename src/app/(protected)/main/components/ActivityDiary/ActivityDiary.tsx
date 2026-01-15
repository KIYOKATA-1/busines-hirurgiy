"use client";

import React, { useMemo, useState } from "react";
import styles from "./ActivityDiary.module.scss";
import AddDiaryEntryModal from "./components/AddDiaryEntryModal/AddDiaryEntryModal";


type StatItem = {
  title: string;
  value: number;
  icon: "calendar" | "check" | "chat";
};

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 3v3M16 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatIcon({ kind }: { kind: StatItem["icon"] }) {
  if (kind === "calendar") return <CalendarIcon />;
  if (kind === "check") return <CheckIcon />;
  return <ChatIcon />;
}

export default function ActivityDiary() {
  const [open, setOpen] = useState(false);

  const stats: StatItem[] = useMemo(
    () => [
      { title: "Всего записей", value: 0, icon: "calendar" },
      { title: "Выполнено", value: 0, icon: "check" },
      { title: "С обратной связью", value: 0, icon: "chat" },
    ],
    []
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <div className={styles.titleBlock}>
          <h2 className={styles.title}>Дневник Активности</h2>
          <p className={styles.subtitle}>Ежедневные записи о выполненных действиях и прогрессе</p>
        </div>

        <button type="button" className={styles.addBtn} onClick={() => setOpen(true)}>
          <span className={styles.addIcon} aria-hidden="true">
            +
          </span>
          Новая запись
        </button>
      </div>

      <div className={styles.stats}>
        {stats.map((s) => (
          <div key={s.title} className={styles.statCard}>
            <div className={styles.statHead}>
              <span className={styles.statIco} aria-hidden="true">
                <StatIcon kind={s.icon} />
              </span>
              <span className={styles.statTitle}>{s.title}</span>
            </div>
            <div className={styles.statValue}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className={styles.list}>
        <div className={styles.empty}>
          Пока нет записей. Нажмите <b>«Новая запись»</b>, чтобы добавить первую.
        </div>
      </div>

      <AddDiaryEntryModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
