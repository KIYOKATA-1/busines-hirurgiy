"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./DiseaseEditModal.module.scss";

import { diseaseService } from "@/services/disease/disease.service";
import { organService } from "@/services/organs/organs.service";

import {
  IDiseaseCategory,
  IDiseaseDetailsResponse,
  IUpdateDiseaseRequest,
} from "@/services/disease/disease.types";

import { IOrgan } from "@/services/organs/organ.types";
import { WarningIcon } from "@/app/components/icons/WarningIcon";

type Props = {
  open: boolean;
  diseaseId: string | null;
  onClose: () => void;
  onUpdated?: () => Promise<void> | void;
};

export default function DiseaseEditModal({
  open,
  diseaseId,
  onClose,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<IDiseaseDetailsResponse | null>(null);

  const [categories, setCategories] = useState<IDiseaseCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [organs, setOrgans] = useState<IOrgan[]>([]);
  const [organsLoading, setOrgansLoading] = useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [editTitle, setEditTitle] = useState(false);
  const [editDesc, setEditDesc] = useState(false);
  const [editCategory, setEditCategory] = useState(false);
  const [editOrgan, setEditOrgan] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [organId, setOrganId] = useState("");

  const organTitle = useMemo(() => {
    const o = organs.find((x) => x.id === organId);
    return o?.title ?? "—";
  }, [organs, organId]);

  const selectedCategoryTitle = useMemo(() => {
    const c = categories.find((x) => x.id === categoryId);
    return c?.title ?? data?.disease?.category?.title ?? "—";
  }, [categories, categoryId, data]);

  const isDirty = useMemo(() => {
    if (!data) return false;
    return (
      title !== (data.disease.title ?? "") ||
      description !== (data.disease.description ?? "") ||
      categoryId !== (data.disease.category?.id ?? "") ||
      organId !== (data.disease.organId ?? "")
    );
  }, [data, title, description, categoryId, organId]);

  const showToast = useCallback((type: "success" | "error", text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  const resetLocal = useCallback(() => {
    setLoading(false);
    setSaving(false);
    setError(null);
    setData(null);

    setCategories([]);
    setCategoriesLoading(false);

    setOrgans([]);
    setOrgansLoading(false);

    setEditTitle(false);
    setEditDesc(false);
    setEditCategory(false);
    setEditOrgan(false);

    setTitle("");
    setDescription("");
    setCategoryId("");
    setOrganId("");

    setToast(null);
  }, []);

  const fillFormFromData = useCallback((d: IDiseaseDetailsResponse) => {
    setTitle(d.disease.title ?? "");
    setDescription(d.disease.description ?? "");
    setCategoryId(d.disease.category?.id ?? "");
    setOrganId(d.disease.organId ?? "");
  }, []);

  const fetchMeta = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const cats = await diseaseService.getCategories();
      setCategories(cats);
    } catch {
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }

    try {
      setOrgansLoading(true);
      const res = await organService.getAll();
      setOrgans(res);
    } catch {
      setOrgans([]);
    } finally {
      setOrgansLoading(false);
    }
  }, []);

  const fetchDetails = useCallback(
    async (id: string) => {
      try {
        setError(null);
        setLoading(true);
        const res = await diseaseService.getById(id);
        setData(res);
        fillFormFromData(res);
      } catch {
        setData(null);
        setError("Не удалось загрузить данные болезни");
      } finally {
        setLoading(false);
      }
    },
    [fillFormFromData]
  );

  useEffect(() => {
    if (!open) return;

    fetchMeta();

    if (diseaseId) fetchDetails(diseaseId);
    else setError("diseaseId не передан");
  }, [open, diseaseId, fetchMeta, fetchDetails]);

  useEffect(() => {
    if (!open) resetLocal();
  }, [open, resetLocal]);

  const closeAndReset = () => {
    onClose();
  };

  const onRetry = async () => {
    if (!diseaseId) return;
    await fetchDetails(diseaseId);
  };

  const onSave = async () => {
    if (!diseaseId) return;

    if (!title.trim()) {
      setError("Название не может быть пустым");
      return;
    }
    if (!categoryId) {
      setError("Выберите категорию");
      return;
    }
    if (!organId) {
      setError("Выберите орган");
      return;
    }

    const payload: IUpdateDiseaseRequest = {
      title: title.trim(),
      description: description.trim(),
      categoryId,
      organId,
    };

    try {
      setError(null);
      setSaving(true);

      await diseaseService.update(diseaseId, payload);

      await fetchDetails(diseaseId);

      setEditTitle(false);
      setEditDesc(false);
      setEditCategory(false);
      setEditOrgan(false);

      if (onUpdated) await onUpdated();

      showToast("success", "Изменения сохранены");
    } catch {
      setError("Не удалось сохранить изменения");
      showToast("error", "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      {toast && (
        <div className={styles.toastWrap} aria-live="polite">
          <div
            className={`${styles.toast} ${
              toast.type === "success" ? styles.toastSuccess : styles.toastError
            }`}
          >
            <div className={styles.toastDot} />
            <div className={styles.toastText}>{toast.text}</div>
          </div>
        </div>
      )}

      <div className={styles.modal}>
        <div className={styles.head}>
          <div className={styles.headLeft}>
            <span className={styles.headIcon}>
              <WarningIcon />
            </span>
            <div className={styles.headText}>
              <div className={styles.headTitle}>Редактирование болезни</div>
              <div className={styles.headSub}>
                {data?.disease?.title ? data.disease.title : "—"}
              </div>
            </div>
          </div>

          <button
            type="button"
            className={styles.iconBtn}
            onClick={closeAndReset}
            aria-label="Закрыть"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          {loading && (
            <div className={styles.stateCard}>
              <div className={styles.stateTitle}>Загрузка...</div>
              <div className={styles.stateDesc}>Подтягиваем данные болезни</div>
              <div className={styles.skeletonGrid}>
                <div className={styles.skeleton} />
                <div className={styles.skeleton} />
                <div className={styles.skeleton} />
              </div>
            </div>
          )}

          {!loading && error && (
            <div className={styles.stateCard}>
              <div className={styles.stateTitle}>Ошибка</div>
              <div className={styles.stateDesc}>{error}</div>

              <div className={styles.stateActions}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={onRetry}
                >
                  Повторить
                </button>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={closeAndReset}
                >
                  Закрыть
                </button>
              </div>
            </div>
          )}

          {!loading && !error && data?.disease && (
            <div className={styles.card}>
              <div className={styles.cardTop}>
                {!editCategory ? (
                  <div className={styles.topLine}>
                    <span className={styles.badge}>{selectedCategoryTitle}</span>
                    <button
                      type="button"
                      className={styles.linkBtn}
                      onClick={() => setEditCategory(true)}
                      disabled={saving}
                    >
                      Изменить
                    </button>
                  </div>
                ) : (
                  <div className={styles.selectWrap}>
                    <select
                      className={styles.select}
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      disabled={categoriesLoading || saving}
                    >
                      <option value="">Выберите категорию</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className={styles.smallBtn}
                      onClick={() => setEditCategory(false)}
                      disabled={saving}
                    >
                      Готово
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.kv}>
                <div className={styles.kvRow}>
                  <div className={styles.kvLabel}>Название</div>

                  {!editTitle ? (
                    <div className={styles.rowLine}>
                      <div className={styles.rowValue}>{title || "—"}</div>
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => setEditTitle(true)}
                        disabled={saving}
                      >
                        Редактировать
                      </button>
                    </div>
                  ) : (
                    <div className={styles.rowEdit}>
                      <input
                        className={styles.input}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={saving}
                        autoFocus
                      />
                      <button
                        type="button"
                        className={styles.smallBtn}
                        onClick={() => setEditTitle(false)}
                        disabled={saving}
                      >
                        Готово
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.kvRow}>
                  <div className={styles.kvLabel}>Орган</div>

                  {!editOrgan ? (
                    <div className={styles.rowLine}>
                      <div className={styles.rowValue}>{organTitle}</div>
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => setEditOrgan(true)}
                        disabled={saving}
                      >
                        Изменить
                      </button>
                    </div>
                  ) : (
                    <div className={styles.rowEdit}>
                      <select
                        className={styles.select}
                        value={organId}
                        onChange={(e) => setOrganId(e.target.value)}
                        disabled={organsLoading || saving}
                      >
                        <option value="">Выберите орган</option>
                        {organs.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.title}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        className={styles.smallBtn}
                        onClick={() => setEditOrgan(false)}
                        disabled={saving}
                      >
                        Готово
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.kvCol}>
                  <div className={styles.kvColHead}>
                    <div className={styles.kvLabel}>Описание</div>

                    {!editDesc ? (
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => setEditDesc(true)}
                        disabled={saving}
                      >
                        Редактировать
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.smallBtn}
                        onClick={() => setEditDesc(false)}
                        disabled={saving}
                      >
                        Готово
                      </button>
                    )}
                  </div>

                  {!editDesc ? (
                    <div className={styles.kvText}>{description || "—"}</div>
                  ) : (
                    <textarea
                      className={styles.textarea}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={saving}
                      rows={5}
                      autoFocus
                    />
                  )}
                </div>
              </div>

              <div className={styles.divider} />
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={closeAndReset}
            disabled={saving}
          >
            Закрыть
          </button>

          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onSave}
            disabled={saving || loading || !data?.disease || !isDirty}
            title={
              !isDirty ? "Нет изменений" : saving ? "Сохранение..." : "Сохранить"
            }
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
