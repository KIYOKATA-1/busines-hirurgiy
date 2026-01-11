"use client";

import { useEffect } from "react";
import styles from "./DeleteParticipantModal.module.scss";

type Props = {
  open: boolean;

  title?: string;
  description?: string;

  confirmText?: string;
  cancelText?: string;

  loading?: boolean;
  error?: string | null;

  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteParticipantModal({
  open,
  title = "Удалить пользователя?",
  description = "Действие необратимо. Пользователь будет удалён.",
  confirmText = "Удалить",
  cancelText = "Отмена",
  loading = false,
  error = null,
  onClose,
  onConfirm,
}: Props) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!loading) onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, loading]);

  if (!open) return null;

  const closeSafe = () => {
    if (loading) return;
    onClose();
  };

  const onOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeSafe();
  };

  return (
    <section
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={onOverlayMouseDown}
    >
      <section className={styles.modal}>
        <header className={styles.head}>
          <h3 className={styles.title}>{title}</h3>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={closeSafe}
            aria-label="Закрыть"
            disabled={loading}
          >
            ✕
          </button>
        </header>

        <section className={styles.content}>
          <p className={styles.desc}>{description}</p>

          {error ? (
            <div className={styles.serverError} role="alert">
              {error}
            </div>
          ) : null}
        </section>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={closeSafe}
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={styles.dangerBtn}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Удаление..." : confirmText}
          </button>
        </footer>
      </section>
    </section>
  );
}
