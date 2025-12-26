"use client";

import styles from "./DiseaseLibrary.module.scss";

export default function DiseaseLibrary() {
  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <div className={styles.title}>Библиотека Болезней</div>
          <div className={styles.desc}>
            Справочник бизнес-болезней и типовых проблем. Раздел в разработке.
          </div>
        </div>
      </div>

      <div className={styles.canvas}>
        <div className={styles.placeholder}>
          Здесь будет библиотека бизнес-болезней
        </div>
      </div>
    </div>
  );
}
