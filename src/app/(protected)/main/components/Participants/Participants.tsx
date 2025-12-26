"use client";

import styles from "./Participants.module.scss";

export default function Participants() {
  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <div className={styles.title}>Участники</div>
          <div className={styles.desc}>
            Управление пользователями и ролями. Раздел в разработке.
          </div>
        </div>
      </div>

      <div className={styles.canvas}>
        <div className={styles.placeholder}>
          Здесь будет список участников
        </div>
      </div>
    </div>
  );
}
