"use client";

import { useState } from "react";
import styles from "./DiseaseLibrary.module.scss";
import AddDiseaseModal from "../AddDiseaseModal/AddDiseaseModal";

export default function DiseaseLibrary() {

  const [openAdd, setOpenAdd] = useState(false);

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div className={styles.topRow}>
          <div className={styles.left}>
            <div className={styles.title}>Библиотека Болезней</div>
            <div className={styles.desc}>
              Управление каталогом бизнес-проблем и методов их лечения
            </div>
          </div>

          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setOpenAdd(true)}
          >
            <span className={styles.addIcon} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className={styles.addText}>Добавить болезнь</span>
          </button>
        </div>
      </div>

      <div className={styles.canvas}>
        <div className={styles.placeholder}>Здесь будет библиотека бизнес-болезней</div>
      </div>

      <AddDiseaseModal open={openAdd} onClose={() => setOpenAdd(false)} />
    </div>
  );
}
