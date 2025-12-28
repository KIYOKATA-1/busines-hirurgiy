"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./AddDiseaseModal.module.scss";
import { IOrgan } from "@/services/organs/organ.types";
import { IDiseaseCategory } from "@/services/disease/disease.types";
import { diseaseService } from "@/services/disease/disease.service";
import { organService } from "@/services/organs/organs.service";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AddDiseaseModal({ open, onClose }: Props) {
  const [categories, setCategories] = useState<IDiseaseCategory[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const [organs, setOrgans] = useState<IOrgan[]>([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [selectedOrganId, setSelectedOrganId] = useState<string>("");

  const categoryOptions = useMemo(() => {
    return diseaseService.toSelectOptions(categories);
  }, [categories]);

  const organOptions = useMemo(() => {
    return organService.toSelectOptions(organs);
  }, [organs]);

  useEffect(() => {
    if (!open) return;

    let mounted = true;

    const loadCategories = async () => {
      try {
        setCatError(null);
        setCatLoading(true);

        const data = await diseaseService.getCategories();
        if (!mounted) return;

        setCategories(data);
        setSelectedCategoryId(data[0]?.id ?? "");
      } catch {
        if (!mounted) return;
        setCategories([]);
        setSelectedCategoryId("");
        setCatError("Не удалось загрузить категории");
      } finally {
        if (!mounted) return;
        setCatLoading(false);
      }
    };

    const loadOrgans = async () => {
      try {
        setOrgError(null);
        setOrgLoading(true);

        const data = await organService.getAll();
        if (!mounted) return;

        setOrgans(data);
        setSelectedOrganId(data[0]?.id ?? "");
      } catch {
        if (!mounted) return;
        setOrgans([]);
        setSelectedOrganId("");
        setOrgError("Не удалось загрузить органы");
      } finally {
        if (!mounted) return;
        setOrgLoading(false);
      }
    };

    loadCategories();
    loadOrgans();

    return () => {
      mounted = false;
    };
  }, [open]);

  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!open) return null;

  return (
    <div className={styles.backdrop} onMouseDown={onBackdrop}>
      <div className={styles.panel} role="dialog" aria-modal="true">
        <div className={styles.head}>
          <div className={styles.headLeft}>
            <div className={styles.title}>Добавить болезнь</div>
            <div className={styles.desc}>
              Создайте карточку проблемы и привяжите её к органу
            </div>
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

        <div className={styles.body}>
          <div className={styles.grid}>
            <div className={styles.field}>
              <div className={styles.label}>Название</div>
              <input className={styles.input} placeholder="Например: Падение продаж" />
            </div>

            <div className={styles.field}>
              <div className={styles.label}>Категория</div>

              <div className={styles.selectWrap}>
                <select
                  className={styles.select}
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  disabled={catLoading}
                >
                  {catLoading && <option value="">Загрузка...</option>}

                  {!catLoading && categoryOptions.length === 0 && (
                    <option value="">Категории не найдены</option>
                  )}

                  {!catLoading &&
                    categoryOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                </select>

                <span className={styles.chevron} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>

              {catError && <div className={styles.inlineError}>{catError}</div>}
            </div>

            <div className={styles.fieldFull}>
              <div className={styles.label}>Орган</div>

              <div className={styles.selectWrap}>
                <select
                  className={styles.select}
                  value={selectedOrganId}
                  onChange={(e) => setSelectedOrganId(e.target.value)}
                  disabled={orgLoading}
                >
                  {orgLoading && <option value="">Загрузка...</option>}

                  {!orgLoading && organOptions.length === 0 && (
                    <option value="">Органы не найдены</option>
                  )}

                  {!orgLoading &&
                    organOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                </select>

                <span className={styles.chevron} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>

              {orgError && <div className={styles.inlineError}>{orgError}</div>}
            </div>

            <div className={styles.fieldFull}>
              <div className={styles.label}>Описание</div>
              <textarea
                className={styles.textarea}
                placeholder="Опишите симптомы, причины и контекст..."
                rows={6}
              />
              <div className={styles.hint}>0/2000</div>
            </div>
          </div>

          <div className={styles.alertInfo}>
            Категории: <b>/api/v1/diseases/categories</b> • Органы: <b>/api/v1/organs</b>
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.secondary} onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className={styles.primary}
            disabled={catLoading || orgLoading || !!catError || !!orgError}
          >
            Добавить
          </button>
        </div>
      </div>
    </div>
  );
}
