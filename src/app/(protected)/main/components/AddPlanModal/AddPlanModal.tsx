"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./AddPlanModal.module.scss";

import {
  IDiseaseListEntry,
  ICreatePlanStepRequest,
  IUpsertDiseasePlanRequest,
} from "@/services/disease/disease.types";
import { diseaseService } from "@/services/disease/disease.service";

type Props = {
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void | Promise<void>;
  entries: IDiseaseListEntry[];
};

type StepDraft = {
  key: string;
  orderNo: number;
  title: string;
  description: string;
};

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function AddPlanModal({ open, onClose, onUpdated, entries }: Props) {
  const [search, setSearch] = useState("");
  const [diseaseId, setDiseaseId] = useState<string>("");

  const [planTitle, setPlanTitle] = useState("");
  const [planDescription, setPlanDescription] = useState("");

  const [planId, setPlanId] = useState<string>("");

  const [steps, setSteps] = useState<StepDraft[]>([
    { key: uid(), orderNo: 1, title: "", description: "" },
  ]);

  const [savingPlan, setSavingPlan] = useState(false);
  const [savingSteps, setSavingSteps] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setSearch("");
    setDiseaseId("");
    setPlanTitle("");
    setPlanDescription("");
    setPlanId("");

    setSteps([{ key: uid(), orderNo: 1, title: "", description: "" }]);

    setSavingPlan(false);
    setSavingSteps(false);
    setError(null);
    setOk(null);
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;

    return entries.filter((e) => {
      const t = e.disease.title?.toLowerCase() ?? "";
      const c = e.disease.category?.title?.toLowerCase() ?? "";
      return t.includes(q) || c.includes(q);
    });
  }, [entries, search]);

  const selectedEntry = useMemo(
    () => entries.find((x) => x.disease.id === diseaseId) ?? null,
    [entries, diseaseId]
  );

  useEffect(() => {
    if (!selectedEntry) return;

    if (selectedEntry.plan) {
      setPlanId(selectedEntry.plan.id);
      setPlanTitle(selectedEntry.plan.title ?? "");
      setPlanDescription(selectedEntry.plan.description ?? "");
    } else {
      setPlanId("");
      setPlanTitle("");
      setPlanDescription("");
    }

    const maxOrder = (selectedEntry.steps ?? []).reduce(
      (m, s) => Math.max(m, s.orderNo),
      0
    );

    setSteps([
      {
        key: uid(),
        orderNo: (maxOrder ? maxOrder + 1 : 1),
        title: "",
        description: "",
      },
    ]);
  }, [selectedEntry]);

  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const canSavePlan =
    !!diseaseId &&
    !!planTitle.trim() &&
    !!planDescription.trim() &&
    !savingPlan &&
    !savingSteps;

  const savePlan = async () => {
    if (!canSavePlan) return;

    try {
      setError(null);
      setOk(null);
      setSavingPlan(true);

      const payload: IUpsertDiseasePlanRequest = {
        title: planTitle.trim(),
        description: planDescription.trim(),
      };

      const res = await diseaseService.upsertPlan(diseaseId, payload);

      const newPlanId =
        (res && typeof res === "object" && "plan" in (res as any) && (res as any).plan?.id) ||
        (res && typeof res === "object" && (res as any).id) ||
        "";

      if (!newPlanId) throw new Error("No plan id returned");

      setPlanId(newPlanId);
      setOk("План сохранён. Теперь добавьте шаги (если нужно).");
      await onUpdated?.();
    } catch {
      setError("Не удалось сохранить план");
    } finally {
      setSavingPlan(false);
    }
  };

  const addStepRow = () => {
    setSteps((prev) => {
      const nextOrder = (prev[prev.length - 1]?.orderNo ?? 0) + 1;
      return [...prev, { key: uid(), orderNo: nextOrder, title: "", description: "" }];
    });
  };

  const removeStepRow = (key: string) => {
    setSteps((prev) => {
      const next = prev.filter((x) => x.key !== key);
      return next.length ? next : [{ key: uid(), orderNo: 1, title: "", description: "" }];
    });
  };

  const updateStep = (key: string, patch: Partial<StepDraft>) => {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  };

  const canSaveSteps = !!planId && !savingPlan && !savingSteps;

  const saveSteps = async () => {
    if (!canSaveSteps) return;

    const prepared = steps
      .map((s) => ({
        ...s,
        title: s.title.trim(),
        description: s.description.trim(),
      }))
      .filter((s) => s.title && s.description);

    if (prepared.length === 0) {
      setError("Добавьте хотя бы один шаг: заполните «Заголовок» и «Описание»");
      return;
    }

    try {
      setError(null);
      setOk(null);
      setSavingSteps(true);

      for (const s of prepared) {
        const payload: ICreatePlanStepRequest = {
          title: s.title,
          description: s.description,
          orderNo: Number(s.orderNo) || 1,
        };
        await diseaseService.createPlanStep(planId, payload);
      }

      setOk("Шаги успешно добавлены");
      await onUpdated?.();
      setTimeout(() => onClose(), 350);
    } catch {
      setError("Не удалось добавить шаги");
    } finally {
      setSavingSteps(false);
    }
  };

  if (!open) return null;

  return (
    <div className={styles.backdrop} onMouseDown={onBackdrop}>
      <div className={styles.panel} role="dialog" aria-modal="true">
        <div className={styles.head}>
          <div className={styles.headLeft}>
            <h1 className={styles.title}>План</h1>
            <h3 className={styles.desc}>Сначала сохраните план, затем добавьте шаги лечения</h3>
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
            {/* ===== Disease select ===== */}
            <div className={styles.fieldFull}>
              <h1 className={styles.label}>Поиск болезни</h1>
              <input
                className={styles.input}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Название или категория..."
                disabled={savingPlan || savingSteps}
              />
            </div>

            <div className={styles.fieldFull}>
              <h1 className={styles.label}>Болезнь</h1>
              <div className={styles.selectWrap}>
                <select
                  className={styles.select}
                  value={diseaseId}
                  onChange={(e) => setDiseaseId(e.target.value)}
                  disabled={savingPlan || savingSteps}
                >
                  <option value="">Выберите болезнь</option>
                  {filtered.map((e) => (
                    <option key={e.disease.id} value={e.disease.id}>
                      {e.disease.title} — {e.disease.category?.title}
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

              {selectedEntry?.plan?.id && (
                <p className={styles.info}>
                  У этой болезни уже есть план — можно обновить его и добавить новые шаги.
                </p>
              )}
            </div>

            <div className={styles.divider} />

            {/* ===== Plan ===== */}
            <h1 className={styles.sectionTitle}>План</h1>

            <div className={styles.planGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Заголовок плана</label>
                <input
                  className={styles.input}
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="Например: План по улучшению прибыльности"
                  disabled={!diseaseId || savingPlan || savingSteps}
                />
              </div>

              <div className={styles.fieldFull}>
                <label className={styles.label}>Описание плана</label>
                <textarea
                  className={styles.textarea}
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  placeholder="Кратко опишите логику плана лечения..."
                  rows={5}
                  disabled={!diseaseId || savingPlan || savingSteps}
                />
              </div>

              <div className={styles.actionsLine}>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={savePlan}
                  disabled={!canSavePlan}
                >
                  {savingPlan ? "Сохранение..." : "Сохранить план"}
                </button>

                <div className={styles.planMeta}>
                  {planId ? (
                    <span className={styles.muted}>planId: {planId}</span>
                  ) : (
                    <span className={styles.muted}>Сначала сохраните план</span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.divider} />

            {/* ===== Steps ===== */}
            <div className={styles.sectionTitle}>Шаги</div>

            {!planId && (
              <p className={styles.info}>
                Чтобы добавить шаги, сначала <b>«Создайте и Сохраните План»</b>.
              </p>
            )}

            <div className={styles.stepsWrap}>
              {steps.map((s) => (
                <div key={s.key} className={styles.stepCard}>
                  <div className={styles.stepTop}>
                    <h1 className={styles.stepLabel}>Шаг</h1>

                    <button
                      type="button"
                      className={styles.stepRemove}
                      onClick={() => removeStepRow(s.key)}
                      disabled={savingSteps || savingPlan}
                      title="Удалить шаг"
                      aria-label="Удалить шаг"
                    >
                      ✕
                    </button>
                  </div>

                  <div className={styles.stepGrid}>
                    <div className={styles.field}>
                      <label className={styles.label}>#</label>
                      <input
                        className={styles.input}
                        type="number"
                        value={s.orderNo}
                        onChange={(e) =>
                          updateStep(s.key, { orderNo: Number(e.target.value) })
                        }
                        disabled={!planId || savingSteps || savingPlan}
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Заголовок</label>
                      <input
                        className={styles.input}
                        value={s.title}
                        onChange={(e) => updateStep(s.key, { title: e.target.value })}
                        disabled={!planId || savingSteps || savingPlan}
                      />
                    </div>

                    <div className={styles.fieldFull}>
                      <div className={styles.label}>Описание</div>
                      <textarea
                        className={styles.textarea}
                        rows={3}
                        value={s.description}
                        onChange={(e) =>
                          updateStep(s.key, { description: e.target.value })
                        }
                        disabled={!planId || savingSteps || savingPlan}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.actionsLine}>
              <button
                type="button"
                className={styles.secondary}
                onClick={addStepRow}
                disabled={!planId || savingSteps || savingPlan}
              >
                + Добавить шаг
              </button>

              <button
                type="button"
                className={styles.primary}
                onClick={saveSteps}
                disabled={!planId || savingSteps || savingPlan}
              >
                {savingSteps ? "Сохранение..." : "Сохранить шаги"}
              </button>
            </div>

            {error && <p className={styles.alertError}>{error}</p>}
            {ok && <p className={styles.alertOk}>{ok}</p>}
          </div>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.secondary}
            onClick={onClose}
            disabled={savingPlan || savingSteps}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
