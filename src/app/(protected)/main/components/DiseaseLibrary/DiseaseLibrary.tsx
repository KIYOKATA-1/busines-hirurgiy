"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./DiseaseLibrary.module.scss";

import AddDiseaseModal from "../AddDiseaseModal/AddDiseaseModal";
import DiseaseEditModal from "../DiseaseEditModal/DiseaseEditModal";
import AddPlanModal from "../AddPlanModal/AddPlanModal";

import { IDiseaseCategory, IDiseaseListEntry } from "@/services/disease/disease.types";
import { diseaseService } from "@/services/disease/disease.service";

import { WarningIcon } from "@/shared/ui/icons/WarningIcon";
import { DeleteIcon, EditIcon } from "@/shared/ui/icons";

type LoadState = "idle" | "loading" | "success" | "error";

function parseDescription(raw: string): { summary: string; symptoms: string[] } {
  const text = (raw ?? "").trim();
  if (!text) return { summary: "", symptoms: [] };

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const symptomsIdx = lines.findIndex((l) =>
    /^симптомы\s*:$/i.test(l) || /^симптомы\s*:/i.test(l)
  );

  if (symptomsIdx === -1) {
    return { summary: text, symptoms: [] };
  }

  const before = lines.slice(0, symptomsIdx);
  const after = lines.slice(symptomsIdx + 1);

  const stopIdx = after.findIndex((l) =>
    /^план/i.test(l) || /^лечение/i.test(l) || /^план лечения/i.test(l)
  );

  const symptomsLines = (stopIdx === -1 ? after : after.slice(0, stopIdx))
    .map((l) => l.replace(/^[-•\d.)\s]+/, "").trim())
    .filter(Boolean);

  const summary = before.join("\n").trim();

  return {
    summary: summary || "",
    symptoms: symptomsLines,
  };
}

export default function DiseaseLibrary() {
  const [openAdd, setOpenAdd] = useState(false);
  const [openPlan, setOpenPlan] = useState(false);

  const [items, setItems] = useState<IDiseaseListEntry[]>([]);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [categories, setCategories] = useState<IDiseaseCategory[]>([]);
  const [metaLoading, setMetaLoading] = useState(false);
  const [categoryId, setCategoryId] = useState<string>("");

  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

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


  const onPlanUpdated = async () => {
    await fetchDiseases();
  };

  const onDelete = async (entry: IDiseaseListEntry) => {
    const disease = entry.disease;
    const ok = window.confirm(`Удалить болезнь "${disease.title}"?`);
    if (!ok) return;

    try {
      setDeletingId(disease.id);
      await diseaseService.remove(disease.id);

      setItems((prev) => prev.filter((x) => x.disease.id !== disease.id));
      await fetchDiseases();
    } catch {
      alert("Не удалось удалить болезнь");
    } finally {
      setDeletingId(null);
    }
  };

  const onEdit = (entry: IDiseaseListEntry) => {
    setEditId(entry.disease.id);
    setOpenEdit(true);
  };

  const closeEdit = () => {
    setOpenEdit(false);
    setEditId(null);
  };

  const hasItems = useMemo(() => items.length > 0, [items]);

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div className={styles.topRow}>
          <div className={styles.left}>
            <h1 className={styles.title}>Библиотека Болезней</h1>
            <p className={styles.desc}>
              Управление каталогом бизнес-проблем и методов их лечения
            </p>
          </div>

          <div className={styles.actionsRow}>
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

            <button
              type="button"
              className={styles.planBtn}
              onClick={() => setOpenPlan(true)}
            >
              <span className={styles.planIcon} aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className={styles.addText}>Добавить план</span>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.filterBlock}>
        <h1 className={styles.filterLabel}>Фильтр по категории</h1>

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
            <p className={styles.emptyTitle}>Ошибка</p>
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

        {state !== "loading" && state !== "error" && !hasItems && (
          <div className={styles.empty}>
            <h1 className={styles.emptyTitle}>Пока пусто</h1>
            <p className={styles.emptyDesc}>
              По выбранной категории ничего не найдено.
            </p>
          </div>
        )}

        {state !== "loading" && state !== "error" && hasItems && (
          <div className={styles.cards}>
            {items.map((entry) => {
              const d = entry.disease;
              const p = entry.plan
              const isDeleting = deletingId === d.id;

              const stepsSorted = [...(entry.steps ?? [])].sort(
                (a, b) => a.orderNo - b.orderNo
              );

              const parsed = parseDescription(d.description);
              const summaryText = parsed.summary || d.description;
              const symptoms = parsed.symptoms;

              return (
                <div key={d.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div className={styles.cardTitleRow}>
                      <WarningIcon className={styles.warnIcon} />
                      <h1 className={styles.cardTitle}>{d.title}</h1>
                    </div>

                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        aria-label="Редактировать"
                        disabled={isDeleting}
                        onClick={() => onEdit(entry)}
                      >
                        <EditIcon />
                      </button>

                      <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.danger}`}
                        aria-label="Удалить"
                        onClick={() => onDelete(entry)}
                        disabled={isDeleting}
                        title={isDeleting ? "Удаление..." : "Удалить"}
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.badgeRow}>
                      <h1 className={styles.badge}>{d.category?.title}</h1>
                    </div>

                    {summaryText && (
                      <p className={styles.summaryText}>{summaryText}</p>
                    )}

                    {symptoms.length > 0 && (
                      <div className={styles.section}>
                        <h1 className={styles.sectionTitle}>Симптомы:</h1>
                        <ul className={styles.bulletList}>
                          {symptoms.map((s, i) => (
                            <li
                              key={`${d.id}-sym-${i}`}
                              className={styles.bulletItem}
                            >
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className={styles.section}>
                      <h1 className={styles.sectionTitle}>План лечения: {p?.title || "План не указан"}</h1>

                      {stepsSorted.length > 0 ? (
                        <div className={styles.planList}>
                          {stepsSorted.map((s, idx) => (
                            <div key={s.id} className={styles.planItem}>
                              <p className={styles.planNum}>{idx + 1}</p>
                              <h1 className={styles.planText}>{s.title}</h1>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={styles.muted}>Шаги пока не добавлены.</p>
                      )}
                    </div>
                  </div>
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

      <AddPlanModal
        open={openPlan}
        onClose={() => setOpenPlan(false)}
        onUpdated={onPlanUpdated}
        entries={items}
      />

      <DiseaseEditModal
        open={openEdit}
        diseaseId={editId}
        onClose={closeEdit}
        onUpdated={fetchDiseases}
      />
    </div>
  );
}
