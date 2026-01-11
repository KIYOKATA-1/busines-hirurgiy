"use client";

import { useEffect, useState } from "react";
import type { FormEvent, MouseEvent as ReactMouseEvent } from "react";
import styles from "./AddDiseaseCategoryModal.module.scss";

import { diseaseService } from "@/services/disease/disease.service";
import { useToast } from "@/app/components/Toast/ToastProvider";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function AddDiseaseCategoryModal({ open, onClose, onCreated }: Props) {
  const toast = useToast();

  const [title, setTitle] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setError(null);
    setSaving(false);
  }, [open]);

  const onBackdrop = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (saving) return;
    if (e.target === e.currentTarget) onClose();
  };

  const disabled = saving || title.trim().length < 2;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    setError(null);

    try {
      setSaving(true);

      await diseaseService.createCategoryAdmin({
        title: title.trim(),
      });

      toast.success("Категория добавлена");
      onCreated?.();
      window.setTimeout(() => onClose(), 250);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Ошибка при добавлении категории";
      const text = String(msg);
      setError(text);
      toast.error(text);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className={styles.backdrop} onMouseDown={onBackdrop}>
      <div className={styles.panel} role="dialog" aria-modal="true">
        <div className={styles.head}>
          <div className={styles.headLeft}>
            <h1 className={styles.title}>Добавить категорию</h1>
            <p className={styles.desc}>Создайте новую категорию для болезней</p>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Закрыть"
            disabled={saving}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <form className={styles.body} onSubmit={onSubmit}>
          <div className={styles.grid}>
            <div className={styles.field}>
              <h1 className={styles.label}>Title</h1>
              <input
                className={styles.input}
                placeholder="Например: Финансы"
                maxLength={80}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          {error && <p className={styles.alertError}>{error}</p>}

          <div className={styles.footer}>
            <button type="button" className={styles.secondary} onClick={onClose} disabled={saving}>
              Отмена
            </button>

            <button type="submit" className={styles.primary} disabled={disabled}>
              {saving ? "Сохранение..." : "Добавить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
