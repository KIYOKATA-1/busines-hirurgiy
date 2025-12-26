"use client";

import styles from "./BusinessAnatomy.module.scss";

export default function BusinessAnatomy() {
  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <div className={styles.title}>Анатомия Бизнеса</div>
          <div className={styles.desc}>
            Интерактивная диаграмма органов бизнеса. Нажмите на орган для
            анализа и диагностики.
          </div>
        </div>

        <button type="button" className={styles.action}>
          <svg
            className={styles.icon}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0)">
              <path
                d="M6.00065 11.3332H4.66732C3.78326 11.3332 2.93542 10.982 2.3103 10.3569C1.68517 9.73174 1.33398 8.88389 1.33398 7.99984C1.33398 7.11578 1.68517 6.26794 2.3103 5.64281C2.93542 5.01769 3.78326 4.6665 4.66732 4.6665H6.00065"
                stroke="currentColor"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 4.6665H11.3333C12.2174 4.6665 13.0652 5.01769 13.6904 5.64281C14.3155 6.26794 14.6667 7.11578 14.6667 7.99984C14.6667 8.88389 14.3155 9.73174 13.6904 10.3569C13.0652 10.982 12.2174 11.3332 11.3333 11.3332H10"
                stroke="currentColor"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5.33398 8H10.6673"
                stroke="currentColor"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0">
                <rect width="16" height="16" fill="white" />
              </clipPath>
            </defs>
          </svg>

          <span>Скрыть связи</span>
        </button>
      </div>

      <div className={styles.canvas}>
        <div className={styles.placeholder}>Здесь будет диаграмма</div>
      </div>

      <div className={styles.legend}>
        <div className={styles.tagGreen}>● Здоровый (80%+)</div>
        <div className={styles.tagYellow}>● Внимание (60–79%)</div>
        <div className={styles.tagRed}>● Критично (&lt;60%)</div>
      </div>
    </div>
  );
}
