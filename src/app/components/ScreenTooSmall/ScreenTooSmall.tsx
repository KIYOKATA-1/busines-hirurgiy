"use client";

import styles from "./ScreenTooSmall.module.scss";

type Props = {
  minWidth?: number; 
  title?: string;
  desc?: string;
};

export default function ScreenTooSmall({
  minWidth = 768,
  title = "Версия для мобильных пока недоступна",
  desc = `Откройте сайт на устройстве шире ${minWidth}px или увеличьте окно браузера.`,
}: Props) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.title}>{title}</div>
        <div className={styles.desc}>{desc}</div>
      </div>
    </div>
  );
}
