"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";

import Header from "@/app/components/Header/Header";
import FloatingBurgerMenu from "@/app/components/FloatingBurgerMenu/FloatingBurgerMenu";
import type { Role } from "@/app/components/Tablet/Tablet";

import { EditIcon } from "@/app/components/icons";
import styles from "./profile.module.scss";

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function initials(name?: string, surname?: string) {
  const a = (name?.trim()?.[0] ?? "").toUpperCase();
  const b = (surname?.trim()?.[0] ?? "").toUpperCase();
  const res = `${a}${b}`.trim();
  return res || "U";
}

type ProfileFieldKey = "email" | "name" | "surname" | "role";

export default function ProfilePage() {
  const router = useRouter();
  const { initialized, loading, isAuth, user, logout } = useSession();

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

  if (!isAuth) return null;

  const role: Role =
    user?.role === "admin" || user?.role === "moderator"
      ? (user.role as Role)
      : "participant";

  const onEditField = (key: ProfileFieldKey) => {
    console.log("edit field:", key);
  };

  return (
    <div className={styles.page}>
      <Header user={user ?? null} onLogout={logout} />

      <main className={styles.main}>
        <div className={styles.container}>
          <section className={styles.hero}>
            <div className={styles.heroInner}>
              <div className={styles.heroTop}>
                <div className={styles.heroLeft}>
                  <div className={styles.avatar} aria-hidden="true">
                    <span className={styles.avatarText}>
                      {initials(user?.name, user?.surname)}
                    </span>
                  </div>

                  <div className={styles.heroMeta}>
                    <h1 className={styles.title}>Личный кабинет</h1>
                    <p className={styles.subtitle}>
                      Профиль пользователя и данные аккаунта
                    </p>

                    <div className={styles.pills}>
                      <span className={styles.pill}>{user?.role ?? "participant"}</span>
                      <span className={styles.pillMuted}>{user?.email ?? "—"}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.statusLine}>
                  <div className={styles.statusDot} aria-hidden="true" />
                  <p className={styles.statusText}>Активен</p>
                </div>
              </div>

              <div className={styles.divider} />

              <div className={styles.blocks}>
                <div className={styles.block}>
                  <div className={styles.blockHead}>
                    <h2 className={styles.blockTitle}>Основная информация</h2>
                    <p className={styles.blockHint}>Поля для редактирования позже</p>
                  </div>

                  <div className={styles.grid}>
                    <div className={styles.item}>
                      <div className={styles.itemTop}>
                        <h1 className={styles.label}>Email</h1>
                        <button
                          type="button"
                          className={styles.editBtn}
                          aria-label="Редактировать Email"
                          onClick={() => onEditField("email")}
                        >
                          <EditIcon />
                        </button>
                      </div>
                      <p className={styles.value}>{user?.email ?? "—"}</p>
                    </div>

                    <div className={styles.item}>
                      <div className={styles.itemTop}>
                        <h1 className={styles.label}>Имя</h1>
                        <button
                          type="button"
                          className={styles.editBtn}
                          aria-label="Редактировать Имя"
                          onClick={() => onEditField("name")}
                        >
                          <EditIcon />
                        </button>
                      </div>
                      <p className={styles.value}>{user?.name ?? "—"}</p>
                    </div>

                    <div className={styles.item}>
                      <div className={styles.itemTop}>
                        <h1 className={styles.label}>Фамилия</h1>
                        <button
                          type="button"
                          className={styles.editBtn}
                          aria-label="Редактировать Фамилия"
                          onClick={() => onEditField("surname")}
                        >
                          <EditIcon />
                        </button>
                      </div>
                      <p className={styles.value}>{user?.surname ?? "—"}</p>
                    </div>

                    <div className={styles.item}>
                      <div className={styles.itemTop}>
                        <h1 className={styles.label}>Роль</h1>
                        <button
                          type="button"
                          className={styles.editBtn}
                          aria-label="Редактировать Роль"
                          onClick={() => onEditField("role")}
                        >
                          <EditIcon />
                        </button>
                      </div>
                      <p className={styles.value}>{user?.role ?? "participant"}</p>
                    </div>
                  </div>
                </div>

                <div className={styles.block}>
                  <div className={styles.blockHead}>
                    <h2 className={styles.blockTitle}>Системные данные</h2>
                    <p className={styles.blockHint}>Даты аккаунта</p>
                  </div>

                  <div className={styles.gridTwo}>
                    <div className={styles.item}>
                      <h1 className={styles.label}>Создан</h1>
                      <p className={styles.value}>{fmtDate(user?.createdAt)}</p>
                    </div>

                    <div className={styles.item}>
                      <h1 className={styles.label}>Обновлён</h1>
                      <p className={styles.value}>{fmtDate(user?.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>
        </div>
      </main>

      <FloatingBurgerMenu
        role={role}
        position="left"
        showBack={true}
        showPersonal={false}
        showAdmin={false}
        backLabel="Назад"
        onBack={() => router.push("/main")}
      />
    </div>
  );
}
