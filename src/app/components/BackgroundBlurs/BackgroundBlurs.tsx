"use client";

import styles from "./BackgroundBlurs.module.scss";

export default function BackgroundBlurs() {
  return (
    <div className={styles.blurLayer}>
      <div className={`${styles.blur} ${styles.cyan}`} />
      <div className={`${styles.blur} ${styles.blue}`} />
      <div className={`${styles.blur} ${styles.purple}`} />
    </div>
  );
}
