"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./DiseaseEditModal.module.scss";

import { diseaseService } from "@/services/disease/disease.service";
import { organService } from "@/services/organs/organs.service";

import {
  IDiseaseCategory,
  IDiseaseDetailsResponse,
  IUpdateDiseaseRequest,
} from "@/services/disease/disease.types";

import { IOrgan } from "@/services/organs/organ.types";
import { WarningIcon } from "@/shared/ui/icons/WarningIcon";

import { useToast } from "@/app/components/Toast/ToastProvider";

type Props = {
  open: boolean;
  diseaseId: string | null;
  onClose: () => void;
  onUpdated?: () => Promise<void> | void;
};


type DDItem = { id: string; label: string };

function Dropdown({
  value,
  items,
  placeholder,
  disabled,
  onChange,
}: {
  value: string;
  items: DDItem[];
  placeholder: string;
  disabled?: boolean;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedLabel = useMemo(() => {
    const found = items.find((x) => x.id === value);
    return found?.label ?? "";
  }, [items, value]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const toggle = () => {
    if (disabled) return;
    setOpen((v) => !v);
  };

  const choose = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  const onKeyDownBtn = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((v) => !v);
    }
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className={styles.dropdown} ref={rootRef}>
      <button
        type="button"
        className={styles.ddBtn}
        onClick={toggle}
        onKeyDown={onKeyDownBtn}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={styles.ddText}>
          {selectedLabel ? selectedLabel : placeholder}
        </span>

        <span className={styles.ddCaret} aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M7 10l5 5 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div className={styles.ddMenu} role="listbox" aria-label={placeholder}>
          {items.length === 0 ? (
            <button
              type="button"
              className={styles.ddItem}
              disabled
              aria-disabled="true"
            >
              Нет вариантов
            </button>
          ) : (
            items.map((it) => {
              const active = it.id === value;
              return (
                <button
                  key={it.id}
                  type="button"
                  className={`${styles.ddItem} ${active ? styles.ddItemActive : ""}`}
                  onClick={() => choose(it.id)}
                  role="option"
                  aria-selected={active}
                >
                  <span className={styles.ddItemText}>{it.label}</span>
                  {active && (
                    <span className={styles.ddCheck} aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M20 6L9 17l-5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function DiseaseEditModal({
  open,
  diseaseId,
  onClose,
  onUpdated,
}: Props) {
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<IDiseaseDetailsResponse | null>(null);

  const [categories, setCategories] = useState<IDiseaseCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [organs, setOrgans] = useState<IOrgan[]>([]);
  const [organsLoading, setOrgansLoading] = useState(false);

  const [editTitle, setEditTitle] = useState(false);
  const [editDesc, setEditDesc] = useState(false);
  const [editCategory, setEditCategory] = useState(false);
  const [editOrgan, setEditOrgan] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [organId, setOrganId] = useState("");

  const STEPS_PER_PAGE = 3;
  const [stepsPage, setStepsPage] = useState(1);

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

    setStepsPage(1);
  }, []);

  const fillFormFromData = useCallback((d: IDiseaseDetailsResponse) => {
    setTitle(d.disease.title ?? "");
    setDescription(d.disease.description ?? "");
    setCategoryId(d.disease.category?.id ?? "");
    setOrganId(d.disease.organId ?? "");
    setStepsPage(1);
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

      toast.success("Изменения сохранены");
    } catch {
      setError("Не удалось сохранить изменения");
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const categoryItems: DDItem[] = useMemo(
    () => categories.map((c) => ({ id: c.id, label: c.title })),
    [categories]
  );

  const organItems: DDItem[] = useMemo(
    () => organs.map((o) => ({ id: o.id, label: o.title })),
    [organs]
  );

  const sortedSteps = useMemo(() => {
    const arr = data?.steps ? [...data.steps] : [];
    arr.sort((a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0));
    return arr;
  }, [data]);

  const stepsTotal = sortedSteps.length;
  const stepsPages = Math.max(1, Math.ceil(stepsTotal / STEPS_PER_PAGE));

  useEffect(() => {
    if (stepsPage > stepsPages) setStepsPage(stepsPages);
  }, [stepsPage, stepsPages]);

  const pagedSteps = useMemo(() => {
    const start = (stepsPage - 1) * STEPS_PER_PAGE;
    return sortedSteps.slice(start, start + STEPS_PER_PAGE);
  }, [sortedSteps, stepsPage]);

  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.head}>
          <div className={styles.headLeft}>
            <span className={styles.headIcon}>
              <WarningIcon />
            </span>
            <div className={styles.headText}>
              <h1 className={styles.headTitle}>Редактирование болезни</h1>
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
              <h1 className={styles.stateTitle}>Загрузка...</h1>
              <h2 className={styles.stateDesc}>Подтягиваем данные болезни</h2>
              <div className={styles.skeletonGrid}>
                <div className={styles.skeleton} />
                <div className={styles.skeleton} />
                <div className={styles.skeleton} />
              </div>
            </div>
          )}

          {!loading && error && (
            <div className={styles.stateCard}>
              <h1 className={styles.stateTitle}>Ошибка</h1>
              <p className={styles.stateDesc}>{error}</p>

              <div className={styles.stateActions}>
                <button type="button" className={styles.primaryBtn} onClick={onRetry}>
                  Повторить
                </button>
                <button type="button" className={styles.secondaryBtn} onClick={closeAndReset}>
                  Закрыть
                </button>
              </div>
            </div>
          )}

          {!loading && !error && data?.disease && (
            <div className={styles.card}>
              <div className={styles.topBar}>
                {!editCategory ? (
                  <>
                    <span className={styles.badge}>{selectedCategoryTitle}</span>
                    <button
                      type="button"
                      className={styles.linkBtn}
                      onClick={() => setEditCategory(true)}
                      disabled={saving}
                    >
                      Изменить
                    </button>
                  </>
                ) : (
                  <div className={styles.inlineEdit}>
                    <Dropdown
                      value={categoryId}
                      items={categoryItems}
                      placeholder={categoriesLoading ? "Загрузка..." : "Выберите категорию"}
                      disabled={categoriesLoading || saving}
                      onChange={(id) => setCategoryId(id)}
                    />
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
                <div className={styles.kvRow3}>
                  <div className={styles.kvLabel}>Название</div>

                  <div className={styles.kvValue}>
                    {!editTitle ? (
                      <div className={styles.valueText}>{title || "—"}</div>
                    ) : (
                      <input
                        className={styles.input}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={saving}
                        autoFocus
                      />
                    )}
                  </div>

                  <div className={styles.kvAction}>
                    {!editTitle ? (
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => setEditTitle(true)}
                        disabled={saving}
                      >
                        Редактировать
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.smallBtn}
                        onClick={() => setEditTitle(false)}
                        disabled={saving}
                      >
                        Готово
                      </button>
                    )}
                  </div>
                </div>

                <div className={styles.kvRow3}>
                  <div className={styles.kvLabel}>Орган</div>

                  <div className={styles.kvValue}>
                    {!editOrgan ? (
                      <div className={styles.valueText}>{organTitle}</div>
                    ) : (
                      <Dropdown
                        value={organId}
                        items={organItems}
                        placeholder={organsLoading ? "Загрузка..." : "Выберите орган"}
                        disabled={organsLoading || saving}
                        onChange={(id) => setOrganId(id)}
                      />
                    )}
                  </div>

                  <div className={styles.kvAction}>
                    {!editOrgan ? (
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => setEditOrgan(true)}
                        disabled={saving}
                      >
                        Изменить
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.smallBtn}
                        onClick={() => setEditOrgan(false)}
                        disabled={saving}
                      >
                        Готово
                      </button>
                    )}
                  </div>
                </div>

                <div className={styles.kvRow3Multi}>
                  <div className={styles.kvLabel}>Описание</div>

                  <div className={styles.kvValue}>
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

                  <div className={styles.kvActionTop}>
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
                </div>
              </div>

              <div className={styles.divider} />

              <div className={styles.block}>
                <div className={styles.blockHead}>
                  <h1 className={styles.blockTitle}>План</h1>
                  <p className={styles.blockHint}>{data.plan ? "Есть" : "Нет"}</p>
                </div>

                {data.plan ? (
                  <div className={styles.panel}>
                    <h1 className={styles.panelTitle}>{data.plan.title}</h1>
                    <p className={styles.panelDesc}>{data.plan.description || "—"}</p>
                  </div>
                ) : (
                  <div className={styles.panelMuted}>—</div>
                )}
              </div>

              <div className={styles.block}>
                <div className={styles.blockHead}>
                  <h1 className={styles.blockTitle}>Шаги</h1>
                  <p className={styles.blockHint}>
                    {stepsTotal ? `Кол-во: ${stepsTotal}` : "Нет"}
                  </p>
                </div>

                {stepsTotal ? (
                  <>
                    <div className={styles.steps}>
                      {pagedSteps.map((s) => (
                        <div key={s.id} className={styles.stepCard}>
                          <div className={styles.stepHead}>
                            <span className={styles.stepNo}>#{s.orderNo}</span>
                            <h1 className={styles.stepTitle}>{s.title}</h1>
                          </div>
                          <p className={styles.stepDesc}>{s.description || "—"}</p>
                        </div>
                      ))}
                    </div>

                    {stepsPages > 1 && (
                      <div className={styles.pagination}>
                        <button
                          type="button"
                          className={styles.pageBtn}
                          onClick={() => setStepsPage((p) => Math.max(1, p - 1))}
                          disabled={stepsPage === 1}
                        >
                          Назад
                        </button>

                        <div className={styles.pageDots}>
                          {Array.from({ length: stepsPages }).map((_, i) => {
                            const n = i + 1;
                            const active = n === stepsPage;
                            return (
                              <button
                                key={n}
                                type="button"
                                className={`${styles.dotBtn} ${active ? styles.dotBtnActive : ""}`}
                                onClick={() => setStepsPage(n)}
                                aria-label={`Страница ${n}`}
                              />
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          className={styles.pageBtn}
                          onClick={() => setStepsPage((p) => Math.min(stepsPages, p + 1))}
                          disabled={stepsPage === stepsPages}
                        >
                          Вперед
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={styles.panelMuted}>—</div>
                )}
              </div>
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
            title={!isDirty ? "Нет изменений" : saving ? "Сохранение..." : "Сохранить"}
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
