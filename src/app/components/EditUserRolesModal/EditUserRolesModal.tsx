"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./EditUserRolesModal.module.scss";

import { adminService } from "@/services/admin/admin.service";
import type { RoleCode } from "@/services/admin/admin.types";

type Props = {
  userId: string;
  userEmail: string;
  userName: string;
  open: boolean;
  onClose: () => void;
  onChanged?: () => void;
};

const ALL_ROLES: RoleCode[] = ["participant", "moderator", "admin"];

type LoadState = "idle" | "loading" | "success" | "error";

function pickPrimaryRole(roles: RoleCode[]): RoleCode | null {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("moderator")) return "moderator";
  if (roles.includes("participant")) return "participant";
  return null;
}

export default function EditUserRolesModal({
  userId,
  userEmail,
  userName,
  open,
  onClose,
  onChanged,
}: Props) {
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [roles, setRoles] = useState<RoleCode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const primaryRole = useMemo(() => pickPrimaryRole(roles), [roles]);
  const rolesLabel = useMemo(() => (roles?.length ? roles.join(", ") : "—"), [roles]);

  const load = async () => {
    try {
      setLoadState("loading");
      setError(null);
      setInfo(null);

      const res = await adminService.getUserRoles(userId);
      setRoles(res.roles || []);
      setLoadState("success");
    } catch (e: any) {
      setLoadState("error");
      setError(e?.response?.data?.error || e?.message || "Ошибка загрузки ролей");
    }
  };

  useEffect(() => {
    if (!open) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  useEffect(() => {
    if (!open) return;

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  const setOnlyRole = async (target: RoleCode) => {
    if (busy) return;

    try {
      setBusy(true);
      setError(null);
      setInfo(null);

      const current = roles || [];

      if (current.length === 1 && current[0] === target) {
        setInfo("Уже установлено");
        setTimeout(() => setInfo(null), 900);
        return;
      }

      if (!current.includes(target)) {
        await adminService.addUserRole(userId, target);
      }

      const toRemove = current.filter((r) => r !== target);
      for (const r of toRemove) {
        await adminService.removeUserRole(userId, r);
      }

      await load();
      onChanged?.();

      setInfo("Сохранено");
      setTimeout(() => setInfo(null), 1200);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Ошибка изменения роли");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className={styles.modal}>
        <header className={styles.head}>
          <div className={styles.titleBlock}>
            <h2 className={styles.title}>Роль пользователя</h2>

            <p className={styles.sub}>
              <span className={styles.mono}>{userEmail}</span>
              <span className={styles.dot}>•</span>
              <span>{userName}</span>
            </p>

            <p className={styles.current}>
              Текущие роли: <span className={styles.currentValue}>{rolesLabel}</span>
            </p>
          </div>

          <button className={styles.closeBtn} type="button" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </header>

        <div className={styles.body}>
          {loadState === "loading" && (
            <div className={styles.loading}>
              <div className="spinner" />
              <p className={styles.loadingText}>Загрузка ролей…</p>
            </div>
          )}

          {loadState === "error" && (
            <div className={styles.stateError}>
              <h3 className={styles.errorTitle}>Ошибка</h3>
              <p className={styles.errorText}>{error}</p>

              <button className={styles.primaryBtn} type="button" onClick={load}>
                Повторить
              </button>
            </div>
          )}

          {loadState === "success" && (
            <>
              {info && <p className={styles.info}>{info}</p>}
              {error && <p className={styles.err}>{error}</p>}

              <fieldset className={styles.rolesGrid} aria-busy={busy}>
                <legend className={styles.legend}>Выберите одну роль</legend>

                {ALL_ROLES.map((r) => {
                  const checked = primaryRole === r;

                  return (
                    <label
                      key={r}
                      className={`${styles.roleItem} ${checked ? styles.roleItemOn : ""} ${
                        busy ? styles.roleItemDisabled : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="userRole"
                        checked={checked}
                        disabled={busy}
                        onChange={() => setOnlyRole(r)}
                      />

                      <span className={styles.roleText}>{r}</span>

                      {busy && checked && <span className={styles.smallSpinner} />}
                    </label>
                  );
                })}
              </fieldset>
            </>
          )}
        </div>

        <footer className={styles.footer}>
          <button className={styles.secondaryBtn} type="button" onClick={onClose} disabled={busy}>
            Закрыть
          </button>
        </footer>
      </section>
    </div>
  );
}
