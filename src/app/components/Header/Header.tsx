"use client";

import styles from "./Header.module.scss";
import Image from "next/image";
type User = {
  name: string;
  surname: string;
};

type HeaderProps = {
  user: User | null;
  onLogout: () => void;
};
export default function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <Image src="/assets/logo.svg" alt="Logo" width={24} height={24} />
        </div>
        <div>
          <div className={styles.title}>Моя Панель</div>
          <div className={styles.subtitle}>
            <div className={styles.subtitle}>
              {user
                ? `Добро пожаловать, ${user.name} ${user.surname}`
                : "Добро пожаловать"}
            </div>
          </div>
        </div>
      </div>

      <button className={styles.logout} onClick={onLogout}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0)">
            <path
              d="M10.667 11.3334L14.0003 8.00008L10.667 4.66675"
              stroke="currentColor"
              strokeWidth="1.33333"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 8H6"
              stroke="currentColor"
              strokeWidth="1.33333"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6"
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

        <span className={styles.logoutText}>Выход</span>
      </button>
    </header>
  );
}
