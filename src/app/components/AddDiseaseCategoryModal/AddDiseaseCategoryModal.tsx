"use client";

import { useEffect, useState, FormEvent } from "react";
import styles from "./AddDiseaseCategoryModal.module.scss";
import { diseaseService } from "@/services/disease/disease.service";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function AddDiseaseCategoryModal({ open, onClose, onCreated }: Props) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCode("");
    setTitle("");
    setError(null);
    setOk(null);
    setSaving(false);
  }, [open]);

  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const disabled = saving || code.trim().length < 1 || title.trim().length < 2;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    setError(null);
    setOk(null);

    try {
      setSaving(true);

      await diseaseService.createCategoryAdmin({
        code: code.trim(),
        title: title.trim(),
      });

      setOk("Категория добавлена");
      onCreated?.();
      setTimeout(() => onClose(), 350);
    } catch {
      setError("Ошибка при добавлении категории");
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
              <h1 className={styles.label}>Code</h1>
              <input
                className={styles.input}
                placeholder="Например: finance"
                maxLength={40}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <h1 className={styles.label}>Title</h1>
              <input
                className={styles.input}
                placeholder="Например: Финансы"
                maxLength={80}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          {error && <p className={styles.alertError}>{error}</p>}
          {ok && <p className={styles.alertOk}>{ok}</p>}

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.secondary}
              onClick={onClose}
              disabled={saving}
            >
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
