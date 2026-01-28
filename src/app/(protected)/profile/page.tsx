"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";

import Header from "@/app/components/Header/Header";
import FloatingBurgerMenu from "@/app/components/FloatingBurgerMenu/FloatingBurgerMenu";
import type { Role } from "@/app/components/Tablet/Tablet";

import { EditIcon } from "@/shared/ui/icons";
import styles from "./profile.module.scss";

import { userService } from "@/services/user/user.service";
import type { IUserMe } from "@/services/user/user.types";

import { useToast } from "@/app/components/Toast/ToastProvider";

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

type EditableKey = "name" | "surname";

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const { initialized, loading, isAuth, user, logout } = useSession();

  const [profile, setProfile] = useState<IUserMe | null>(null);

  const [editingKey, setEditingKey] = useState<EditableKey | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftSurname, setDraftSurname] = useState("");

  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (!initialized) return;
    if (!isAuth) router.replace("/login");
  }, [initialized, isAuth, router]);

  useEffect(() => {
    if (!user) return;
    const u = user as any as IUserMe;
    setProfile(u);
    setDraftName(u?.name ?? "");
    setDraftSurname(u?.surname ?? "");
  }, [user]);

  if (!initialized || loading) {
    return (
      <div className={styles.loader}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!isAuth) return null;

  const current = profile ?? ((user as any) as IUserMe);

  const role: Role = (() => {
    const r = (current?.role ?? "participant") as any;
    return r === "admin" || r === "moderator" ? (r as Role) : "participant";
  })();

  const startEdit = (key: EditableKey) => {
    setEditingKey(key);
    setDraftName(current?.name ?? "");
    setDraftSurname(current?.surname ?? "");
    toast.info("Режим редактирования");
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setDraftName(current?.name ?? "");
    setDraftSurname(current?.surname ?? "");
    toast.info("Отмена изменений");
  };

  const canSave = (() => {
    const n = (draftName ?? "").trim();
    const s = (draftSurname ?? "").trim();
    if (!n || !s) return false;
    if (n === (current?.name ?? "") && s === (current?.surname ?? "")) return false;
    return true;
  })();

  const save = async () => {
    const payload = {
      name: (draftName ?? "").trim(),
      surname: (draftSurname ?? "").trim(),
    };

    if (!payload.name || !payload.surname) {
      toast.error("Имя и фамилия не должны быть пустыми.");
      return;
    }

    try {
      setSaveLoading(true);
      const updated = await userService.updateMe(payload);
      setProfile(updated);
      setEditingKey(null);
      toast.success("Данные профиля сохранены");
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        e?.message ||
        "Ошибка при сохранении.";
      toast.error(String(msg));
    } finally {
      setSaveLoading(false);
    }
  };

  const onKeyDownInput = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === "Escape") cancelEdit();
    if (ev.key === "Enter") {
      if (canSave && !saveLoading) save();
    }
  };

  const renderValueOrInput = (key: EditableKey) => {
    const isEditing = editingKey === key;

    if (!isEditing) {
      return (
        <p className={styles.value}>
          {key === "name" ? current?.name ?? "—" : current?.surname ?? "—"}
        </p>
      );
    }

    return (
      <div className={styles.inputWrap}>
        <input
          className={styles.input}
          value={key === "name" ? draftName : draftSurname}
          onChange={(e) =>
            key === "name" ? setDraftName(e.target.value) : setDraftSurname(e.target.value)
          }
          onKeyDown={onKeyDownInput}
          autoFocus
        />

        <div className={styles.inlineActions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={cancelEdit}
            disabled={saveLoading}
          >
            Отмена
          </button>

          <button
            type="button"
            className={styles.saveBtn}
            onClick={save}
            disabled={!canSave || saveLoading}
          >
            {saveLoading ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    );
  };

  const isAnyEditing = editingKey !== null;

  return (
    <div className={styles.page}>
      <Header user={current ?? null} onLogout={logout} />

      <main className={styles.main}>
        <div className={styles.container}>
          <section className={styles.hero}>
            <div className={styles.heroInner}>
              <div className={styles.heroTop}>
                <div className={styles.heroLeft}>
                  <div className={styles.avatar} aria-hidden="true">
                    <span className={styles.avatarText}>
                      {initials(current?.name, current?.surname)}
                    </span>
                  </div>

                  <div className={styles.heroMeta}>
                    <h1 className={styles.title}>Личный кабинет</h1>
                    <p className={styles.subtitle}>Профиль пользователя и данные аккаунта</p>

                    <div className={styles.pills}>
                      <span className={styles.pill}>{current?.role ?? "participant"}</span>
                      <span className={styles.pillMuted}>{current?.email ?? "—"}</span>
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
                    <p className={styles.blockHint}>Редактируются только имя и фамилия</p>
                  </div>

                  <div className={styles.grid}>
                    <div className={styles.item}>
                      <div className={styles.itemTop}>
                        <h1 className={styles.label}>Email</h1>
                      </div>
                      <p className={styles.value}>{current?.email ?? "—"}</p>
                    </div>

                    <div className={styles.item}>
                      <div className={styles.itemTop}>
                        <h1 className={styles.label}>Имя</h1>
                        <button
                          type="button"
                          className={styles.editBtn}
                          aria-label="Редактировать Имя"
                          onClick={() => startEdit("name")}
                          disabled={saveLoading || (isAnyEditing && editingKey !== "name")}
                        >
                          <EditIcon />
                        </button>
                      </div>
                      {renderValueOrInput("name")}
                    </div>

                    <div className={styles.item}>
                      <div className={styles.itemTop}>
                        <h1 className={styles.label}>Фамилия</h1>
                        <button
                          type="button"
                          className={styles.editBtn}
                          aria-label="Редактировать Фамилию"
                          onClick={() => startEdit("surname")}
                          disabled={saveLoading || (isAnyEditing && editingKey !== "surname")}
                        >
                          <EditIcon />
                        </button>
                      </div>
                      {renderValueOrInput("surname")}
                    </div>

                    <div className={styles.item}>
                      <div className={styles.itemTop}>
                        <h1 className={styles.label}>Роль</h1>
                      </div>
                      <p className={styles.value}>{current?.role ?? "participant"}</p>
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
                      <p className={styles.value}>{fmtDate(current?.createdAt)}</p>
                    </div>

                    <div className={styles.item}>
                      <h1 className={styles.label}>Обновлён</h1>
                      <p className={styles.value}>{fmtDate(current?.updatedAt)}</p>
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
