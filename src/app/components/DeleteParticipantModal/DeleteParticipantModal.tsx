"use client";

import { useEffect, useRef } from "react";
import styles from "./DeleteParticipantModal.module.scss";
import ModalPortal from "@/app/components/ModalPortal/ModalPortal";

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
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    document.body.classList.add("modalOpen");

    const t = window.setTimeout(() => {
      cancelRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(t);
      document.body.classList.remove("modalOpen");
    };
  }, [open]);

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
    <ModalPortal>
      <section
        className={styles.overlay}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={onOverlayMouseDown}
      >
        <section className={styles.modal}>
          <header className={styles.head}>
            <div className={styles.headText}>
              <h3 className={styles.title}>{title}</h3>
              <p className={styles.subTitle}>Подтвердите действие</p>
            </div>

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
              ref={cancelRef}
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
    </ModalPortal>
  );
}
