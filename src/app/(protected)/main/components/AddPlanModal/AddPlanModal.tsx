"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import styles from "./AddPlanModal.module.scss";

import {
  ICreatePlanStepRequest,
  IUpsertDiseasePlanRequest,
  IDiseaseListEntry,
  IUpdatePlanStepRequest,
  IDiseasePlanWithStepsResponse,
} from "@/services/disease/disease.types";
import { diseaseService } from "@/services/disease/disease.service";

import type {
  Props,
  StepDraft,
  WizardStep,
  ToastKind,
  ToastState,
  ExistingStepDraft,
} from "./AddPlanModal.types";

import { uid } from "@/shared/utils/uid";
import { DiseaseDropdownOption } from "@/app/components/DiseaseDropdown/DiseaseDropdown.types";
import DiseaseDropdown from "@/app/components/DiseaseDropdown/DiseaseDropdown";
import { DeleteIcon } from "@/app/components/icons";

const getMaxOrder = (steps: { orderNo: number }[]): number => {
  return steps.reduce((m, s) => Math.max(m, Number(s.orderNo) || 0), 0);
};

const getNextOrder = (steps: { orderNo: number }[]): number => {
  const max = getMaxOrder(steps);
  return max > 0 ? max + 1 : 1;
};

const normalizeOrderNo = (n: number): number => {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return 1;
  return Math.floor(v);
};

const isDirtyExisting = (s: ExistingStepDraft) => {
  return (
    normalizeOrderNo(s.orderNo) !== normalizeOrderNo(s.initial.orderNo) ||
    s.title.trim() !== s.initial.title.trim() ||
    s.description.trim() !== s.initial.description.trim()
  );
};

export default function AddPlanModal({ open, onClose, onUpdated, entries }: Props) {
  const [step, setStep] = useState<WizardStep>(1);
  const [animDir, setAnimDir] = useState<"next" | "prev">("next");

  const [diseaseId, setDiseaseId] = useState<string>("");

  const [planTitle, setPlanTitle] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [planId, setPlanId] = useState<string>("");

  const [existingDrafts, setExistingDrafts] = useState<ExistingStepDraft[]>([]);
  const [loadingPlan, setLoadingPlan] = useState(false);

  const [steps, setSteps] = useState<StepDraft[]>([
    { key: uid(), orderNo: 1, title: "", description: "" },
  ]);

  const [savingPlan, setSavingPlan] = useState(false);
  const [savingSteps, setSavingSteps] = useState(false);

  const [deletingStepId, setDeletingStepId] = useState<string | null>(null);
  const [savingExistingStepId, setSavingExistingStepId] = useState<string | null>(
    null
  );

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastState>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (kind: ToastKind, message: string) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);

    setToast({ id: uid(), kind, message });

    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 4500);
  };

  const isBusy =
    savingPlan || savingSteps || loadingPlan || !!deletingStepId || !!savingExistingStepId;

  useEffect(() => {
    if (!open) return;

    setStep(1);
    setAnimDir("next");

    setDiseaseId("");

    setPlanTitle("");
    setPlanDescription("");
    setPlanId("");

    setExistingDrafts([]);
    setLoadingPlan(false);

    setSteps([{ key: uid(), orderNo: 1, title: "", description: "" }]);

    setSavingPlan(false);
    setSavingSteps(false);
    setDeletingStepId(null);
    setSavingExistingStepId(null);

    setError(null);
    setOk(null);
    setToast(null);

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, [open]);

  const diseaseOptions: DiseaseDropdownOption[] = useMemo(() => {
    return entries.map((e) => ({
      value: e.disease.id,
      label: e.disease.title,
      subLabel: e.disease.category?.title ?? "",
    }));
  }, [entries]);

  const selectedEntry: IDiseaseListEntry | null = useMemo(() => {
    return entries.find((x) => x.disease.id === diseaseId) ?? null;
  }, [entries, diseaseId]);

  const onBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (isBusy) return;
    if (e.target === e.currentTarget) onClose();
  };

  const loadPlanAndSteps = async (id: string) => {
    setLoadingPlan(true);
    setError(null);
    setOk(null);

    try {
      const res: IDiseasePlanWithStepsResponse =
        await diseaseService.getPlanWithStepsByDiseaseId(id);

      const sorted = [...(res.steps ?? [])].sort((a, b) => a.orderNo - b.orderNo);

      setPlanId(res.plan.id);
      setPlanTitle(res.plan.title ?? "");
      setPlanDescription(res.plan.description ?? "");

      setExistingDrafts(
        sorted.map((s) => ({
          id: s.id,
          key: uid(),
          orderNo: Number(s.orderNo) || 1,
          title: s.title ?? "",
          description: s.description ?? "",
          initial: {
            orderNo: Number(s.orderNo) || 1,
            title: s.title ?? "",
            description: s.description ?? "",
          },
        }))
      );

      setSteps([
        {
          key: uid(),
          orderNo: getNextOrder(sorted),
          title: "",
          description: "",
        },
      ]);
    } catch {
      setPlanId("");
      setPlanTitle("");
      setPlanDescription("");
      setExistingDrafts([]);
      setSteps([{ key: uid(), orderNo: 1, title: "", description: "" }]);
    } finally {
      setLoadingPlan(false);
    }
  };

  const canGoNextFromDisease = !!diseaseId && !isBusy;

  const canSavePlan =
    !!diseaseId && !!planTitle.trim() && !!planDescription.trim() && !isBusy;

  const canGoNextFromPlan = !!planId && !isBusy;

  const canSaveSteps = !!planId && !isBusy;

  const goNext = async () => {
    setError(null);
    setOk(null);

    switch (step) {
      case 1: {
        if (!canGoNextFromDisease) return;
        setAnimDir("next");
        setStep(2);
        await loadPlanAndSteps(diseaseId);
        return;
      }
      case 2: {
        if (!canGoNextFromPlan) return;
        setAnimDir("next");
        setStep(3);
        return;
      }
      default:
        return;
    }
  };

  const goPrev = () => {
    setError(null);
    setOk(null);

    switch (step) {
      case 2:
        setAnimDir("prev");
        setStep(1);
        return;
      case 3:
        setAnimDir("prev");
        setStep(2);
        return;
      default:
        return;
    }
  };

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

      const plan = await diseaseService.upsertPlan(diseaseId, payload);
      if (!plan) throw new Error("Plan is null");

      setPlanId(plan.id);

      setOk("План сохранён.");
      showToast("success", "План сохранён");

      await loadPlanAndSteps(diseaseId);
      await onUpdated?.();
    } catch {
      setError("Не удалось сохранить план");
      showToast("error", "Не удалось сохранить план");
    } finally {
      setSavingPlan(false);
    }
  };

  const addStepRow = () => {
    setSteps((prev) => {
      const base = existingDrafts.map((x) => ({ orderNo: x.orderNo }));
      const lastOrder =
        prev[prev.length - 1]?.orderNo ?? getNextOrder(base.length ? base : [{ orderNo: 0 }]);

      const nextOrder = normalizeOrderNo(lastOrder) + 1;
      return [...prev, { key: uid(), orderNo: nextOrder, title: "", description: "" }];
    });
  };

  const removeStepRow = (key: string) => {
    setSteps((prev) => {
      const next = prev.filter((x) => x.key !== key);
      if (next.length) return next;

      const base = existingDrafts.map((x) => ({ orderNo: x.orderNo }));
      return [
        {
          key: uid(),
          orderNo: getNextOrder(base.length ? base : [{ orderNo: 0 }]),
          title: "",
          description: "",
        },
      ];
    });
  };

  const updateStep = (key: string, patch: Partial<StepDraft>) => {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  };

  const updateExistingDraft = (id: string, patch: Partial<ExistingStepDraft>) => {
    setExistingDrafts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };

  const resetExistingDraft = (id: string) => {
    setExistingDrafts((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              orderNo: s.initial.orderNo,
              title: s.initial.title,
              description: s.initial.description,
            }
          : s
      )
    );
  };

  const saveExistingStep = async (stepId: string) => {
    if (!planId) return;

    const draft = existingDrafts.find((x) => x.id === stepId);
    if (!draft) return;

    const prepared = {
      orderNo: normalizeOrderNo(draft.orderNo),
      title: draft.title.trim(),
      description: draft.description.trim(),
    };

    if (!prepared.title || !prepared.description) {
      showToast("error", "Заполните заголовок и описание");
      setError("Заполните заголовок и описание у шага");
      return;
    }

    if (!isDirtyExisting(draft)) {
      showToast("info", "Нет изменений");
      return;
    }

    try {
      setError(null);
      setOk(null);
      setSavingExistingStepId(stepId);

      const payload: IUpdatePlanStepRequest = {
        title: prepared.title,
        description: prepared.description,
        orderNo: prepared.orderNo,
      };

      await diseaseService.updatePlanStep(planId, stepId, payload);

      showToast("success", "Шаг обновлён");

      await loadPlanAndSteps(diseaseId);
      await onUpdated?.();
    } catch {
      showToast("error", "Не удалось обновить шаг");
      setError("Не удалось обновить шаг");
    } finally {
      setSavingExistingStepId(null);
    }
  };

  const getPreparedNewSteps = () =>
    steps
      .map((s) => ({
        key: s.key,
        orderNo: normalizeOrderNo(s.orderNo),
        title: s.title.trim(),
        description: s.description.trim(),
      }))
      .filter((s) => s.title.length > 0 && s.description.length > 0);

  const saveSteps = async (): Promise<boolean> => {
    if (!canSaveSteps) return false;

    const prepared = getPreparedNewSteps();

    if (prepared.length === 0) {
      setOk(null);
      setError("Добавьте хотя бы один шаг: заполните «Заголовок» и «Описание»");
      showToast("error", "Заполните заголовок и описание хотя бы у одного шага");
      return false;
    }

    try {
      setError(null);
      setOk(null);
      setSavingSteps(true);

      for (const s of prepared) {
        const payload: ICreatePlanStepRequest = {
          title: s.title,
          description: s.description,
          orderNo: s.orderNo,
        };

        await diseaseService.createPlanStep(planId, payload);
      }

      setOk("Шаги сохранены.");
      showToast("success", "Шаги сохранены");

      await loadPlanAndSteps(diseaseId);
      await onUpdated?.();

      return true;
    } catch {
      setError("Не удалось сохранить шаги");
      showToast("error", "Не удалось сохранить шаги");
      return false;
    } finally {
      setSavingSteps(false);
    }
  };

  const saveStepsAndClose = async () => {
    if (!planId || isBusy) return;

    const prepared = getPreparedNewSteps();

    if (prepared.length === 0) {
      showToast("info", "Ничего не добавлено");
      onClose();
      return;
    }

    const okSaved = await saveSteps();
    if (okSaved) onClose();
  };

  const deleteExistingStep = async (stepId: string) => {
    if (!planId) return;

    const confirmed = window.confirm("Удалить этот шаг? Это действие нельзя отменить.");
    if (!confirmed) return;

    try {
      setError(null);
      setOk(null);
      setDeletingStepId(stepId);

      await diseaseService.deletePlanStep(planId, stepId);

      showToast("success", "Шаг удалён");

      await loadPlanAndSteps(diseaseId);
      await onUpdated?.();
    } catch {
      showToast("error", "Не удалось удалить шаг");
      setError("Не удалось удалить шаг");
    } finally {
      setDeletingStepId(null);
    }
  };

  if (!open) return null;

  return (
    <div className={styles.backdrop} onMouseDown={onBackdrop}>
      {toast && (
        <div className={styles.toastWrap} key={toast.id}>
          <div
            className={[
              styles.toast,
              toast.kind === "success" ? styles.toastSuccess : "",
              toast.kind === "error" ? styles.toastError : "",
              toast.kind === "info" ? styles.toastInfo : "",
            ].join(" ")}
            role="status"
            aria-live="polite"
          >
            {toast.message}
            <button
              type="button"
              className={styles.toastClose}
              onClick={() => setToast(null)}
              aria-label="Закрыть уведомление"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.head}>
          <div className={styles.headLeft}>
            <h1 className={styles.title}>План</h1>
            <h3 className={styles.desc}>Шаг {step} из 3</h3>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Закрыть"
            disabled={isBusy}
            title={isBusy ? "Дождитесь завершения операции" : "Закрыть"}
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
          <div className={styles.grid} data-step={step} data-dir={animDir}>
            {step === 1 && (
              <div className={styles.fieldFull}>
                <h1 className={styles.label}>Болезнь</h1>

                <DiseaseDropdown
                  value={diseaseId}
                  options={diseaseOptions}
                  onChange={(val) => {
                    setDiseaseId(val);
                    setError(null);
                    setOk(null);
                  }}
                  disabled={isBusy}
                  placeholder="Выберите болезнь"
                />

                {selectedEntry?.plan?.id && diseaseId && (
                  <p className={styles.info}>
                    У этой болезни уже есть план — вы сможете обновить его и увидеть шаги.
                  </p>
                )}
              </div>
            )}

            {step === 2 && (
              <>
                <div className={styles.fieldFull}>
                  <h1 className={styles.sectionTitle}>План</h1>
                </div>

                <div className={styles.planGrid}>
                  <div className={styles.field}>
                    <label className={styles.label}>Заголовок плана</label>
                    <input
                      className={styles.input}
                      value={planTitle}
                      onChange={(e) => setPlanTitle(e.target.value)}
                      placeholder="Например: План по улучшению прибыльности"
                      disabled={!diseaseId || isBusy}
                    />
                  </div>

                  <div className={styles.fieldFull}>
                    <label className={styles.label}>Описание плана</label>
                    <textarea
                      className={styles.textarea}
                      value={planDescription}
                      onChange={(e) => setPlanDescription(e.target.value)}
                      placeholder="Кратко опишите логику плана лечения..."
                      rows={6}
                      disabled={!diseaseId || isBusy}
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
                      {loadingPlan ? (
                        <p className={styles.muted}>Загрузка...</p>
                      ) : planId ? (
                        <p className={styles.muted}>Готово &#40; Можете дальше добавить шаги &#41;</p>
                      ) : (
                        <p className={styles.muted}>План ещё не создан</p>
                      )}
                    </div>
                  </div>

                  {existingDrafts.length > 0 && (
                    <p className={styles.info}>
                      Уже есть шаги: <b>{existingDrafts.length}</b>. Их можно редактировать на следующем шаге.
                    </p>
                  )}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className={styles.fieldFull}>
                  <h1 className={styles.sectionTitle}>Шаги</h1>
                  <p className={styles.desc}>
                    Существующие шаги можно редактировать и удалять. Ниже — создание новых шагов.
                  </p>
                </div>

                {existingDrafts.length > 0 && (
                  <div className={styles.stepsWrap}>
                    {existingDrafts.map((s) => {
                      const dirty = isDirtyExisting(s);
                      const savingThis = savingExistingStepId === s.id;
                      const deletingThis = deletingStepId === s.id;

                      return (
                        <div key={s.key} className={styles.stepCard}>
                          <div className={styles.stepTop}>
                            <h1 className={styles.stepLabel}>Шаг {normalizeOrderNo(s.orderNo)}</h1>

                            <div className={styles.stepTopActions}>
                              <button
                                type="button"
                                className={styles.stepGhost}
                                onClick={() => resetExistingDraft(s.id)}
                                disabled={isBusy || !dirty}
                                title="Сбросить изменения"
                              >
                                Сброс
                              </button>

                              <button
                                type="button"
                                className={styles.stepSave}
                                onClick={() => saveExistingStep(s.id)}
                                disabled={isBusy || !dirty}
                                title={dirty ? "Сохранить изменения" : "Нет изменений"}
                              >
                                {savingThis ? "..." : "Сохранить"}
                              </button>

                              <button
                                type="button"
                                className={styles.stepDelete}
                                onClick={() => deleteExistingStep(s.id)}
                                disabled={isBusy}
                                title="Удалить шаг"
                              >
                                {deletingThis ? "..." : <DeleteIcon />}
                              </button>
                            </div>
                          </div>

                          <div className={styles.stepGrid}>
                            <div className={styles.field}>
                              <label className={styles.label}>#</label>
                              <input
                                className={styles.input}
                                type="number"
                                value={s.orderNo}
                                onChange={(e) =>
                                  updateExistingDraft(s.id, { orderNo: Number(e.target.value) })
                                }
                                disabled={!planId || isBusy}
                              />
                            </div>

                            <div className={styles.field}>
                              <label className={styles.label}>Заголовок</label>
                              <input
                                className={styles.input}
                                value={s.title}
                                onChange={(e) => updateExistingDraft(s.id, { title: e.target.value })}
                                disabled={!planId || isBusy}
                              />
                            </div>

                            <div className={styles.fieldFull}>
                              <label className={styles.label}>Описание</label>
                              <textarea
                                className={styles.textarea}
                                rows={3}
                                value={s.description}
                                onChange={(e) =>
                                  updateExistingDraft(s.id, { description: e.target.value })
                                }
                                disabled={!planId || isBusy}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className={styles.divider} />

                <div className={styles.stepsWrap}>
                  {steps.map((s) => (
                    <div key={s.key} className={styles.stepCard}>
                      <div className={styles.stepTop}>
                        <h1 className={styles.stepLabel}>Новый шаг</h1>

                        <button
                          type="button"
                          className={styles.stepRemove}
                          onClick={() => removeStepRow(s.key)}
                          disabled={isBusy}
                          title="Удалить шаг"
                          aria-label="Удалить шаг"
                        >
                          <DeleteIcon />
                        </button>
                      </div>

                      <div className={styles.stepGrid}>
                        <div className={styles.field}>
                          <label className={styles.label}>#</label>
                          <input
                            className={styles.input}
                            type="number"
                            value={s.orderNo}
                            onChange={(e) => updateStep(s.key, { orderNo: Number(e.target.value) })}
                            disabled={!planId || isBusy}
                          />
                        </div>

                        <div className={styles.field}>
                          <label className={styles.label}>Заголовок</label>
                          <input
                            className={styles.input}
                            value={s.title}
                            onChange={(e) => updateStep(s.key, { title: e.target.value })}
                            disabled={!planId || isBusy}
                          />
                        </div>

                        <div className={styles.fieldFull}>
                          <label className={styles.label}>Описание</label>
                          <textarea
                            className={styles.textarea}
                            rows={3}
                            value={s.description}
                            onChange={(e) => updateStep(s.key, { description: e.target.value })}
                            disabled={!planId || isBusy}
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
                    disabled={!planId || isBusy}
                  >
                    + Добавить шаг
                  </button>
                </div>
              </>
            )}

            {error && <p className={styles.alertError}>{error}</p>}
            {ok && <p className={styles.alertOk}>{ok}</p>}
          </div>
        </div>

        <div className={styles.footer}>
          {step === 3 ? (
            <>
              <button type="button" className={styles.secondary} onClick={goPrev} disabled={isBusy}>
                Назад
              </button>

              <button
                type="button"
                className={styles.primary}
                onClick={saveStepsAndClose}
                disabled={!planId || isBusy}
              >
                {savingSteps ? "Сохранение..." : "Сохранить"}
              </button>
            </>
          ) : (
            <>
              <button type="button" className={styles.secondary} onClick={onClose} disabled={isBusy}>
                Закрыть
              </button>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={goPrev}
                  disabled={isBusy || step === 1}
                >
                  Назад
                </button>

                <button
                  type="button"
                  className={styles.primary}
                  onClick={goNext}
                  disabled={
                    isBusy ||
                    (step === 1 && !canGoNextFromDisease) ||
                    (step === 2 && !canGoNextFromPlan)
                  }
                  title={step === 2 && !planId ? "Сначала сохраните план" : undefined}
                >
                  Далее
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
