"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./ActivityDiary.module.scss";
import AddDiaryEntryModal from "./components/AddDiaryEntryModal/AddDiaryEntryModal";

import { useToast } from "@/app/components/Toast/ToastProvider";

import { diaryService } from "@/services/diary/diary.service";
import type { IDiaryActivityItem } from "@/services/diary/diary.types";
import { userDiseasesService } from "@/services/userDiseases/userDiseases.service";
import type {
  IUserDiseaseItem,
  IUserDiseaseStepItem,
  UserDiseaseStatusCode,
  UserStepState,
} from "@/services/userDiseases/userDiseases.types";
import {
  normalizeStepStateValue,
  STEP_STATE_VALUES,
  stepStateToCode,
} from "@/services/userDiseases/userDiseases.state";
import { ActivityDiaryIcon, BackIcon } from "@/shared/ui/icons";
import { CheckIcon } from "@/shared/ui/icons/CheckIcon";
import { ChatIcon } from "@/shared/ui/icons/ChatIcon";


type StatItem = {
  id: "awaiting" | "needsWork" | "answered";
  title: string;
  value: number;
  icon: "calendar" | "check" | "chat";
};

type ViewMode = "diseases" | "steps" | "feedback";
type DiseaseStatusFilter = "all" | UserDiseaseStatusCode;

type DiaryEntryItem = Extract<IDiaryActivityItem, { type: "diary" }>;
type DiaryFeedbackItem = Extract<IDiaryActivityItem, { type: "feedback" }>;

const DISEASE_STATUS_FILTERS: Array<{ value: DiseaseStatusFilter; label: string }> = [
  { value: "all", label: "Все статусы" },
  { value: 0, label: "Ожидает" },
  { value: 1, label: "В процессе" },
  { value: 2, label: "Завершено" },
];

const DEFAULT_STEPS_LIMIT = 50;
const DEFAULT_DIARY_LIMIT = 100;

function StatIcon({ kind }: { kind: StatItem["icon"] }) {
  if (kind === "calendar") return <ActivityDiaryIcon className={styles.statSvg} />;
  if (kind === "check") return <CheckIcon className={styles.statSvg24} />;
  return <ChatIcon className={styles.statSvg24} />;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString();
}

function toTime(iso?: string | null) {
  const t = new Date(iso ?? "").getTime();
  return Number.isNaN(t) ? 0 : t;
}

function clampPct(v: number) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function stateLabel(s: UserStepState) {
  const v = String(s || "").toLowerCase();
  if (v === "completed") return "Выполнено";
  if (v === "active") return "В процессе";
  if (v === "pending") return "Ожидает";
  return s || "—";
}

function isCompleted(s: UserStepState) {
  return String(s || "").toLowerCase() === "completed";
}

function isResolved(status?: string | null) {
  const s = String(status ?? "").toLowerCase();
  return s === "resolved" || s === "done" || s === "completed";
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

export default function ActivityDiary() {
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [presetTags, setPresetTags] = useState<string[]>([]);
  const [presetTitle, setPresetTitle] = useState<string | null>(null);
  const [reportDiseaseId, setReportDiseaseId] = useState<string | null>(null);
  const [resolveAfterReport, setResolveAfterReport] = useState<IUserDiseaseItem | null>(null);

  const [diaryItems, setDiaryItems] = useState<IDiaryActivityItem[]>([]);
  const [diaryLoading, setDiaryLoading] = useState(false);

  const [view, setView] = useState<ViewMode>("diseases");

  const [diseasesLoading, setDiseasesLoading] = useState(false);
  const [diseases, setDiseases] = useState<IUserDiseaseItem[]>([]);
  const [selectedDisease, setSelectedDisease] = useState<IUserDiseaseItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<DiseaseStatusFilter>("all");

  const [stepsLoading, setStepsLoading] = useState(false);
  const [steps, setSteps] = useState<IUserDiseaseStepItem[]>([]);
  const [completeLoadingId, setCompleteLoadingId] = useState<string | null>(null);
  const [stateLoadingId, setStateLoadingId] = useState<string | null>(null);
  const [resolveLoadingId, setResolveLoadingId] = useState<string | null>(null);

  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const raf1 = useRef<number | null>(null);
  const raf2 = useRef<number | null>(null);

  const [viewHeight, setViewHeight] = useState<number | "auto">("auto");
  const [heightAnimating, setHeightAnimating] = useState(false);

  const diaryEntries = useMemo(() => {
    return diaryItems.filter((item): item is DiaryEntryItem => item.type === "diary");
  }, [diaryItems]);

  const feedbackByDiaryId = useMemo(() => {
    const map: Record<string, DiaryFeedbackItem[]> = {};
    for (const item of diaryItems) {
      if (item.type !== "feedback") continue;
      if (item.payload.targetType !== "diary" || !item.payload.diaryId) continue;
      if (!map[item.payload.diaryId]) map[item.payload.diaryId] = [];
      map[item.payload.diaryId].push(item);
    }
    return map;
  }, [diaryItems]);

  const feedbackEntries = useMemo(() => {
    return diaryEntries
      .map((entry) => {
        const feedback = (feedbackByDiaryId[entry.id] ?? [])
          .slice()
          .sort((a, b) => toTime(a.createdAt) - toTime(b.createdAt));
        return { diary: entry, feedback };
      })
      .filter((entry) => entry.feedback.length > 0)
      .sort((a, b) => toTime(b.diary.createdAt) - toTime(a.diary.createdAt));
  }, [diaryEntries, feedbackByDiaryId]);

  const diaryStats = useMemo(() => {
    const answered = diaryEntries.filter(
      (item) => (feedbackByDiaryId[item.id] ?? []).length > 0
    ).length;
    const awaiting = Math.max(0, diaryEntries.length - answered);

    return {
      awaiting,
      needsWork: 0,
      answered,
    };
  }, [diaryEntries, feedbackByDiaryId]);

  const stats: StatItem[] = useMemo(
    () => [
      {
        id: "awaiting",
        title: "Ожидают проверки",
        value: diaryStats.awaiting,
        icon: "calendar",
      },
      {
        id: "needsWork",
        title: "Нужна доработка",
        value: diaryStats.needsWork,
        icon: "check",
      },
      {
        id: "answered",
        title: "Есть ответ",
        value: diaryStats.answered,
        icon: "chat",
      },
    ],
    [diaryStats]
  );

  const cleanupRaf = () => {
    if (raf1.current) cancelAnimationFrame(raf1.current);
    if (raf2.current) cancelAnimationFrame(raf2.current);
    raf1.current = null;
    raf2.current = null;
  };

  const animateToContentHeight = useCallback(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    if (prefersReducedMotion()) {
      setViewHeight("auto");
      setHeightAnimating(false);
      return;
    }

    cleanupRaf();

    const start = outer.getBoundingClientRect().height;
    const target = inner.scrollHeight;

    if (Math.abs(start - target) < 2) {
      setViewHeight("auto");
      setHeightAnimating(false);
      return;
    }

    setViewHeight(start);
    setHeightAnimating(true);

    raf1.current = requestAnimationFrame(() => {
      raf2.current = requestAnimationFrame(() => {
        setViewHeight(target);
      });
    });
  }, []);

  useEffect(() => {
    return () => cleanupRaf();
  }, []);

  const loadDiseases = useCallback(
    async (opts?: { keepSelectedUserDiseaseId?: string | null; status?: DiseaseStatusFilter }) => {
      try {
        setDiseasesLoading(true);
        const statusValue = opts?.status ?? statusFilter;
        const statusParam = statusValue === "all" ? undefined : statusValue;
        const res = await userDiseasesService.getMyDiseases(
          statusParam === undefined ? undefined : { status: statusParam }
        );
        const items = res.items ?? [];
        setDiseases(items);

        const selectedId = opts?.keepSelectedUserDiseaseId ?? selectedDisease?.userDiseaseId ?? null;
        if (selectedId) {
          const nextSelected = items.find((d) => d.userDiseaseId === selectedId) ?? null;
          if (nextSelected) {
            setSelectedDisease(nextSelected);
            return;
          }
          if (items.length > 0) {
            setSelectedDisease(items[0]);
            return;
          }
          setSelectedDisease(null);
          return;
        }

        if (items.length > 0) {
          setSelectedDisease(items[0]);
        }
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.detail ||
          e?.message ||
          "Не удалось загрузить болезни.";
        toast.error(String(msg));
      } finally {
        setDiseasesLoading(false);
      }
    },
    [toast, selectedDisease?.userDiseaseId, statusFilter]
  );

  const loadSteps = useCallback(
    async (userDiseaseId: string, totalSteps?: number) => {
      try {
        setStepsLoading(true);
        const limit =
          typeof totalSteps === "number" && Number.isFinite(totalSteps) && totalSteps > 0
            ? Math.floor(totalSteps)
            : DEFAULT_STEPS_LIMIT;
        const res = await userDiseasesService.getStepsByUserDiseaseId(userDiseaseId, {
          limit,
          offset: 0,
        });
        const items = (res.items ?? []).slice().sort((a, b) => {
          const da = new Date(a.createdAt).getTime();
          const db = new Date(b.createdAt).getTime();
          return da - db;
        });
        setSteps(items);
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.detail ||
          e?.message ||
          "Не удалось загрузить шаги.";
        toast.error(String(msg));
        setSteps([]);
      } finally {
        setStepsLoading(false);
      }
    },
    [toast]
  );

  const loadDiary = useCallback(async () => {
    try {
      setDiaryLoading(true);
      const res = await diaryService.getMyDiary({
        limit: DEFAULT_DIARY_LIMIT,
        offset: 0,
      });
      setDiaryItems(res.items ?? []);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        e?.message ||
        "Не удалось загрузить дневник.";
      toast.error(String(msg));
      setDiaryItems([]);
    } finally {
      setDiaryLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDiseases();
    loadDiary();
  }, []);

  useEffect(() => {
    if (!selectedDisease?.userDiseaseId) return;
    if (view !== "steps") return;
    loadSteps(selectedDisease.userDiseaseId, selectedDisease.totalSteps);
  }, [selectedDisease?.userDiseaseId, selectedDisease?.totalSteps, loadSteps, view]);

  useEffect(() => {
    animateToContentHeight();
  }, [
    animateToContentHeight,
    view,
    selectedDisease?.userDiseaseId,
    diseasesLoading,
    diseases.length,
    stepsLoading,
    steps.length,
    diaryLoading,
    feedbackEntries.length,
  ]);

  useEffect(() => {
    const onResize = () => {
      if (heightAnimating) return;
      animateToContentHeight();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [animateToContentHeight, heightAnimating]);

  const onPickDisease = (d: IUserDiseaseItem) => {
    setSelectedDisease(d);
    setSteps([]);
    setView("steps");
  };

  const onBack = () => {
    setView("diseases");
    setSteps([]);
  };

  const onShowFeedback = () => {
    setView("feedback");
    loadDiary();
  };

  const onStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRaw = e.target.value;
    const nextFilter =
      nextRaw === "all" ? "all" : (Number(nextRaw) as UserDiseaseStatusCode);
    setStatusFilter(nextFilter);
    loadDiseases({
      keepSelectedUserDiseaseId: selectedDisease?.userDiseaseId ?? null,
      status: nextFilter,
    });
  };

  const onCompleteStep = useCallback(
    async (userStepId: string) => {
      if (!selectedDisease) return;

      try {
        setCompleteLoadingId(userStepId);
        await userDiseasesService.completeStep(userStepId);
        toast.success("Шаг выполнен");

        await loadSteps(selectedDisease.userDiseaseId, selectedDisease.totalSteps);
        await loadDiseases({ keepSelectedUserDiseaseId: selectedDisease.userDiseaseId });
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.detail ||
          e?.message ||
          "Ошибка выполнения шага.";
        toast.error(String(msg));
      } finally {
        setCompleteLoadingId(null);
      }
    },
    [selectedDisease, toast, loadSteps, loadDiseases]
  );

  const onResolveDisease = useCallback(
    async (disease: IUserDiseaseItem) => {
      try {
        setResolveLoadingId(disease.userDiseaseId);
        await userDiseasesService.resolveDisease(disease.userDiseaseId);
        toast.success("Болезнь завершена");

        await loadDiseases({ keepSelectedUserDiseaseId: disease.userDiseaseId });
        if (selectedDisease?.userDiseaseId === disease.userDiseaseId && view === "steps") {
          await loadSteps(disease.userDiseaseId, disease.totalSteps);
        }
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.detail ||
          e?.message ||
          "Ошибка завершения болезни.";
        toast.error(String(msg));
      } finally {
        setResolveLoadingId(null);
      }
    },
    [loadDiseases, loadSteps, selectedDisease?.userDiseaseId, toast, view]
  );

  const onChangeStepState = useCallback(
    async (userStepId: string, nextState: UserStepState) => {
      if (!selectedDisease) return;

      try {
        setStateLoadingId(userStepId);
        await userDiseasesService.updateStepState(userStepId, stepStateToCode(nextState));
        toast.success("Статус шага обновлён");

        await loadSteps(selectedDisease.userDiseaseId, selectedDisease.totalSteps);
        await loadDiseases({ keepSelectedUserDiseaseId: selectedDisease.userDiseaseId });
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.detail ||
          e?.message ||
          "Ошибка обновления статуса шага.";
        toast.error(String(msg));
      } finally {
        setStateLoadingId(null);
      }
    },
    [selectedDisease, toast, loadSteps, loadDiseases]
  );

  const openReportModal = (opts?: { disease?: IUserDiseaseItem | null; resolveAfter?: boolean }) => {
    const fallbackId = diseases[0]?.userDiseaseId ?? null;
    const nextDiseaseId =
      opts?.disease?.userDiseaseId ?? selectedDisease?.userDiseaseId ?? fallbackId;

    setReportDiseaseId(nextDiseaseId);
    setPresetTags([]);
    setPresetTitle("Отчёт");
    if (opts?.resolveAfter && opts?.disease) {
      setResolveAfterReport(opts.disease);
    } else {
      setResolveAfterReport(null);
    }
    setOpen(true);
  };

  const handleReportClose = () => {
    setOpen(false);
    setResolveAfterReport(null);
    setReportDiseaseId(null);
  };

  const handleReportSaved = useCallback(
    async () => {
      await loadDiary();
      if (!resolveAfterReport) return;
      const diseaseToResolve = resolveAfterReport;
      setResolveAfterReport(null);
      await onResolveDisease(diseaseToResolve);
    },
    [loadDiary, onResolveDisease, resolveAfterReport]
  );

  const onAddReport = () => {
    openReportModal({ resolveAfter: false });
  };

  const selectedPct = clampPct(selectedDisease?.progressPercent ?? 0);

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <div className={styles.titleBlock}>
          <h2 className={styles.title}>Дневник Активности</h2>
        </div>
      </div>

      <div className={styles.stats}>
        {stats.map((s) => {
          const isAnswered = s.id === "answered";
          const isActive = isAnswered && view === "feedback";
          const cardClass = [
            styles.statCard,
            isAnswered ? styles.statCardClickable : "",
            isActive ? styles.statCardActive : "",
          ].join(" ");

          const content = (
            <>
              <div className={styles.statHead}>
                <span className={styles.statIco} aria-hidden="true">
                  <StatIcon kind={s.icon} />
                </span>
                <span className={styles.statTitle}>{s.title}</span>
              </div>
              <div className={styles.statValue}>{s.value}</div>
            </>
          );

          if (isAnswered) {
            return (
              <button
                key={s.id}
                type="button"
                className={cardClass}
                onClick={onShowFeedback}
                aria-pressed={isActive}
              >
                {content}
              </button>
            );
          }

          return (
            <div key={s.id} className={cardClass}>
              {content}
            </div>
          );
        })}
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div className={styles.panelHeadLeft}>
            <div className={styles.panelTitle}>
              {view === "steps" ? "Шаги" : view === "feedback" ? "Ответы" : "Болезни"}
            </div>

            {view === "steps" ? (
              <div className={styles.panelSub}>
                <div className={styles.panelSubTitle}>{selectedDisease?.diseaseName ?? "—"}</div>

                <div className={styles.panelSubMeta}>
                  <span className={styles.panelPill}>
                    {Math.max(0, Number(selectedDisease?.completedSteps ?? 0))}/
                    {Math.max(0, Number(selectedDisease?.totalSteps ?? 0))} шагов
                  </span>
                  <span className={styles.panelPillMuted}>{selectedPct}%</span>
                </div>
              </div>
            ) : view === "feedback" ? (
              <div className={styles.panelHint}>Отчёты с ответами модератора</div>
            ) : (
              <div className={styles.panelHint}>Выберите болезнь → выполняйте шаги → отчитывайтесь</div>
            )}
          </div>

          <div className={styles.panelHeadRight}>
            {view === "steps" ? (
              <>
                <button type="button" className={styles.ghostBtn} onClick={onBack}>
                  <BackIcon className={styles.backIcon} />
                  <span className={styles.backText}>Назад</span>
                </button>

                <button
                  type="button"
                  className={styles.smallBtn}
                  onClick={() => {
                    if (!selectedDisease?.userDiseaseId) return;
                    loadSteps(selectedDisease.userDiseaseId, selectedDisease.totalSteps);
                  }}
                  disabled={stepsLoading || !selectedDisease?.userDiseaseId}
                >
                  {stepsLoading ? "..." : "Обновить"}
                </button>
              </>
            ) : view === "feedback" ? (
              <>
                <button type="button" className={styles.ghostBtn} onClick={onBack}>
                  <BackIcon className={styles.backIcon} />
                  <span className={styles.backText}>Назад</span>
                </button>

                <button
                  type="button"
                  className={styles.smallBtn}
                  onClick={loadDiary}
                  disabled={diaryLoading}
                >
                  {diaryLoading ? "..." : "Обновить"}
                </button>
              </>
            ) : (
              <>
                <div className={styles.filter}>
                  <label className={styles.filterLabel} htmlFor="disease-status-filter">
                    Статус
                  </label>
                  <select
                    id="disease-status-filter"
                    className={[styles.badge, styles.filterSelect].join(" ")}
                    value={String(statusFilter)}
                    onChange={onStatusFilterChange}
                    disabled={diseasesLoading}
                  >
                    {DISEASE_STATUS_FILTERS.map((option) => (
                      <option key={String(option.value)} value={String(option.value)}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  className={styles.smallBtn}
                  onClick={() =>
                    loadDiseases({ keepSelectedUserDiseaseId: selectedDisease?.userDiseaseId ?? null })
                  }
                  disabled={diseasesLoading}
                >
                  {diseasesLoading ? "..." : "Обновить"}
                </button>
              </>
            )}
          </div>
        </div>

        <div
          ref={outerRef}
          className={[styles.viewOuter, heightAnimating ? styles.viewOuterAnimating : ""].join(" ")}
          style={{ height: viewHeight === "auto" ? "auto" : `${viewHeight}px` }}
          onTransitionEnd={(e) => {
            if (e.propertyName !== "height") return;
            setViewHeight("auto");
            setHeightAnimating(false);
          }}
        >
          <div ref={innerRef} className={styles.viewInner} data-view={view}>
            {view === "diseases" ? (
              <>
                {diseasesLoading ? (
                  <div className={styles.emptyBox}>Загрузка болезней...</div>
                ) : diseases.length === 0 ? (
                  <div className={styles.emptyBox}>
                    <div className={styles.emptyTitle}>Нет болезней</div>
                    <div className={styles.emptyText}>Когда болезнь будет назначена — она появится здесь.</div>
                  </div>
                ) : (
                  <>
                    <div className={styles.diseaseGrid}>
                      {diseases.map((d) => {
                        const active = selectedDisease?.userDiseaseId === d.userDiseaseId;
                        const pct = clampPct(d.progressPercent ?? 0);
                        const resolved = isResolved(d.status);
                        const resolving = resolveLoadingId === d.userDiseaseId;

                        return (
                          <div key={d.userDiseaseId} className={styles.diseaseItem}>
                            <button
                              type="button"
                              className={[styles.diseaseCard, active ? styles.diseaseCardActive : ""].join(" ")}
                              onClick={() => onPickDisease(d)}
                            >
                              <div className={styles.diseaseTop}>
                                <div className={styles.diseaseName}>{d.diseaseName}</div>
                                <div className={styles.diseaseStatus}>{String(d.status || "—")}</div>
                              </div>

                              <div className={styles.diseaseChips}>
                                <span className={styles.chip}>{d.categoryName}</span>
                                <span className={styles.chipMuted}>{d.organName}</span>
                              </div>

                              <div className={styles.diseaseProg}>
                                <div className={styles.diseaseProgMeta}>
                                  <span className={styles.diseaseProgText}>
                                    {Math.max(0, Number(d.completedSteps ?? 0))}/
                                    {Math.max(0, Number(d.totalSteps ?? 0))} шагов
                                  </span>
                                  <span className={styles.diseaseProgPct}>{pct}%</span>
                                </div>

                                <div className={styles.progressBar}>
                                  <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            </button>

                            <div className={styles.diseaseActions}>
                              <button
                                type="button"
                                className={styles.primaryBtn}
                                onClick={() => openReportModal({ disease: d, resolveAfter: true })}
                                disabled={resolved || resolving}
                                title={resolved ? "Болезнь уже завершена" : "Завершить болезнь"}
                              >
                                {resolving ? "..." : resolved ? "Завершено" : "Завершить"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className={styles.reportActions}>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={onAddReport}
                        disabled={diseasesLoading}
                      >
                        Добавить отчет
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : view === "steps" ? (
              <>
                {!selectedDisease?.userDiseaseId ? (
                  <div className={styles.emptyBox}>
                    <div className={styles.emptyTitle}>Болезнь не выбрана</div>
                    <div className={styles.emptyText}>Нажмите “Назад” и выберите болезнь.</div>
                  </div>
                ) : stepsLoading ? (
                  <div className={styles.emptyBox}>Загрузка шагов...</div>
                ) : steps.length === 0 ? (
                  <div className={styles.emptyBox}>
                    <div className={styles.emptyTitle}>0 шагов</div>
                  </div>
                ) : (
                  <div className={styles.stepsList}>
                    {steps.map((s, idx) => {
                      const done = isCompleted(s.state);
                      const completing = completeLoadingId === s.id;
                      const updatingState = stateLoadingId === s.id;
                      const stateValue = normalizeStepStateValue(s.state);

                      return (
                        <div key={s.id} className={styles.stepCard}>
                          <div className={styles.stepTop}>
                            <div className={styles.stepLeft}>
                              <div className={styles.stepIndex}>{idx + 1}</div>

                              <div className={styles.stepMeta}>
                                <div className={styles.stepIdRow}>
                                  <span className={styles.stepKey}>StepId:</span>
                                  <span className={styles.mono}>{String(s.stepId ?? "—")}</span>
                                </div>

                                <div className={styles.stepDates}>
                                  <span className={styles.dateLine}>
                                    <span className={styles.dateLabel}>Создан:</span>
                                    <span className={styles.dateValue}>{fmtDate(s.createdAt)}</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <select
                              className={[styles.badge, styles.stateSelect].join(" ")}
                              value={stateValue}
                              onChange={(e) =>
                                onChangeStepState(s.id, e.target.value as UserStepState)
                              }
                              disabled={stepsLoading || completing || updatingState}
                              aria-label="Статус шага"
                            >
                              {STEP_STATE_VALUES.map((value) => (
                                <option key={value} value={value}>
                                  {stateLabel(value)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className={styles.stepActions}>
                            <button
                              type="button"
                              className={styles.primaryBtn}
                              onClick={() => onCompleteStep(s.id)}
                              disabled={done || completing || updatingState}
                              title={done ? "Уже выполнено" : "Отметить выполненным"}
                            >
                              {completing ? "..." : "Выполнить"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                {diaryLoading ? (
                  <div className={styles.emptyBox}>Загрузка ответов...</div>
                ) : feedbackEntries.length === 0 ? (
                  <div className={styles.emptyBox}>
                    <div className={styles.emptyTitle}>Ответов нет</div>
                    <div className={styles.emptyText}>
                      Когда модератор оставит feedback — он появится здесь.
                    </div>
                  </div>
                ) : (
                  <div className={styles.feedbackList}>
                    {feedbackEntries.map((entry) => (
                      <div key={entry.diary.id} className={styles.feedbackCard}>
                        <div className={styles.feedbackHead}>
                          <div className={styles.feedbackTitle}>
                            {entry.diary.payload.mood || "Отчёт"}
                          </div>
                          <div className={styles.feedbackDate}>
                            {fmtDate(entry.diary.createdAt)}
                          </div>
                        </div>

                        <div className={styles.feedbackText}>{entry.diary.payload.text}</div>

                        {entry.diary.payload.tags?.length ? (
                          <div className={styles.feedbackTags}>
                            {entry.diary.payload.tags.map((tag) => (
                              <span key={`${entry.diary.id}-${tag}`} className={styles.feedbackTag}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <div className={styles.feedbackReplies}>
                          {entry.feedback.map((fb) => (
                            <div key={fb.id} className={styles.feedbackReply}>
                              <div className={styles.feedbackReplyHead}>
                                <span className={styles.feedbackBadge}>MOD</span>
                                <span className={styles.feedbackDate}>
                                  {fmtDate(fb.createdAt)}
                                </span>
                              </div>
                              <div className={styles.feedbackText}>{fb.payload.text}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <AddDiaryEntryModal
        open={open}
        onClose={handleReportClose}
        presetTitle={presetTitle}
        presetTags={presetTags}
        diseases={diseases}
        defaultDiseaseId={reportDiseaseId}
        lockDisease={Boolean(resolveAfterReport)}
        onSaved={handleReportSaved}
      />
    </div>
  );
}
