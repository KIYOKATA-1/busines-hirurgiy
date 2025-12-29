"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./DiseaseLibrary.module.scss";
import AddDiseaseModal from "../AddDiseaseModal/AddDiseaseModal";
import {
  IDiseaseListItem,
  IDiseaseCategory,
} from "@/services/disease/disease.types";
import { diseaseService } from "@/services/disease/disease.service";
import { WarningIcon } from "@/app/components/icons/WarningIcon";
import { DeleteIcon, EditIcon } from "@/app/components/icons";
import { authService } from "@/services/auth/auth.service";

type LoadState = "idle" | "loading" | "success" | "error";

export default function DiseaseLibrary() {
  const [openAdd, setOpenAdd] = useState(false);
  const [items, setItems] = useState<IDiseaseListItem[]>([]);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<IDiseaseCategory[]>([]);
  const [metaLoading, setMetaLoading] = useState(false);
  const [categoryId, setCategoryId] = useState<string>("");

  const fetchCategories = useCallback(async () => {
    try {
      setMetaLoading(true);
      const data = await diseaseService.getCategories();
      setCategories(data);
    } catch {
      setCategories([]);
    } finally {
      setMetaLoading(false);
    }
  }, []);

  const fetchDiseases = useCallback(async () => {
    try {
      setError(null);
      setState("loading");

      const data = await diseaseService.getAll(
        categoryId ? { categoryId } : undefined
      );

      setItems(data);
      setState("success");
    } catch {
      setItems([]);
      setState("error");
      setError("Не удалось загрузить болезни");
    }
  }, [categoryId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchDiseases();
  }, [fetchDiseases]);

  const onCreated = async () => {
    setOpenAdd(false);
    await fetchDiseases();
  };

  const onDelete = async (disease: IDiseaseListItem) => {
    const ok = window.confirm(`Удалить болезнь "${disease.title}"?`);
    if (!ok) return;

    const token = authService.getAccessToken();
    if (!token) {
      alert("Токен не найден (access_token). Перелогиньтесь.");
      return;
    }

    try {
      setDeletingId(disease.id);
      await diseaseService.remove(disease.id, token);

      setItems((prev) => prev.filter((x) => x.id !== disease.id));
      await fetchDiseases();
    } catch {
      alert("Не удалось удалить болезнь");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div className={styles.topRow}>
          <div className={styles.left}>
            <div className={styles.title}>Библиотека Болезней</div>
            <div className={styles.desc}>
              Управление каталогом бизнес-проблем и методов их лечения
            </div>
          </div>

          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setOpenAdd(true)}
          >
            <span className={styles.addIcon} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className={styles.addText}>Добавить болезнь</span>
          </button>
        </div>
      </div>

      <div className={styles.filterBlock}>
        <div className={styles.filterLabel}>Фильтр по категории</div>

        <div className={styles.selectWrap}>
          <select
            className={styles.select}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={metaLoading}
          >
            <option value="">Все категории</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <span className={styles.chevron} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 10l5 5 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>

      <div className={styles.canvas}>
        {state === "loading" && (
          <div className={styles.cards}>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className={styles.cardSkeleton} />
            ))}
          </div>
        )}

        {state === "error" && (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>Ошибка</div>
            <div className={styles.emptyDesc}>{error}</div>
            <button
              type="button"
              className={styles.retryBtn}
              onClick={fetchDiseases}
            >
              Повторить
            </button>
          </div>
        )}

        {state !== "loading" && state !== "error" && items.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>Пока пусто</div>
            <div className={styles.emptyDesc}>
              По выбранной категории ничего не найдено.
            </div>
          </div>
        )}

        {state !== "loading" && state !== "error" && items.length > 0 && (
          <div className={styles.cards}>
            {items.map((d) => {
              const isDeleting = deletingId === d.id;

              return (
                <div key={d.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div className={styles.cardTitleRow}>
                      <WarningIcon />
                      <div className={styles.cardTitle}>{d.title}</div>
                    </div>

                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        aria-label="Редактировать"
                        disabled={isDeleting}
                      >
                        <EditIcon />
                      </button>

                      <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.danger}`}
                        aria-label="Удалить"
                        onClick={() => onDelete(d)}
                        disabled={isDeleting}
                        title={isDeleting ? "Удаление..." : "Удалить"}
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </div>

                  <div className={styles.badgeRow}>
                    <span className={styles.badge}>{d.category?.title}</span>
                  </div>

                  <div className={styles.cardDesc}>{d.description}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddDiseaseModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onCreated={onCreated}
      />
    </div>
  );
}
