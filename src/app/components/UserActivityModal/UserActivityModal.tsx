"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useContext,
  createContext,
} from "react";
import styles from "./UserActivityModal.module.scss";

import type {
  IModeratorUserActivityItem,
  IModeratorUserActivityResponse,
  IModeratorUserProgressResponse,
  IModeratorUserTreatmentResponse,
  ITreatmentDiseaseItem,
  ModeratorUserActivityType,
} from "@/services/moderatorUsers/moderatorUsers.types";

import { moderatorUsersService } from "@/services/moderatorUsers/moderatorUsers.service";
import { useToast } from "@/app/components/Toast/ToastProvider";

import ModalPortal from "@/app/components/ModalPortal/ModalPortal";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type LoadState = "idle" | "loading" | "success" | "error";

type FeedbackTargetType =
  | "diary"
  | "step_completed"
  | "assignment"
  | "status_change"
  | "all";

type FeedbackItem = {
  id: string;
  userId: string;
  targetType: FeedbackTargetType;
  targetId: string;
  message: string;
  createdAtISO: string;
};

type Page = "analytics" | "events";

type Props = {
  open: boolean;
  userId: string;
  title: string;
  onClose: () => void;

  initialLimit?: number;
  initialOffset?: number;

  onSubmitFeedback?: (payload: FeedbackItem) => void;
};

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function clampPct(v: number) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function safeStr(v: any) {
  return typeof v === "string" ? v : "";
}

function ellipsize(s: string, max = 160) {
  const t = (s ?? "").trim();
  if (!t) return "—";
  if (t.length <= max) return t;
  return t.slice(0, max).trimEnd() + "…";
}

function formatActivity(item: IModeratorUserActivityItem) {
  if (item.type === "assignment") {
    return {
      badge: "Назначение",
      title: `Назначено: ${item.payload.title}`,
      subtitle: `Шагов: ${item.payload.totalSteps} · userDiseaseId: ${item.payload.userDiseaseId}`,
      targetType: "assignment" as const,
    };
  }

  if (item.type === "step_completed") {
    return {
      badge: "Шаг",
      title: "Шаг выполнен",
      subtitle: `stepId: ${item.payload.stepId} · userDiseaseId: ${item.payload.userDiseaseId}`,
      targetType: "step_completed" as const,
    };
  }

  if (item.type === "status_change") {
    return {
      badge: "Статус",
      title: `Статус: ${item.payload.to}`,
      subtitle: `Причина: ${item.payload.reason} · userDiseaseId: ${item.payload.userDiseaseId}`,
      targetType: "status_change" as const,
    };
  }

  return {
    badge: "Дневник",
    title: `Запись дневника · mood: ${item.payload.mood}`,
    subtitle: `Теги: ${(item.payload.tags || []).join(", ") || "—"} · ${ellipsize(
      item.payload.text,
      220
    )}`,
    targetType: "diary" as const,
  };
}

const FILTERS: Array<{
  key: "all" | ModeratorUserActivityType;
  label: string;
}> = [
  { key: "all", label: "Все" },
  { key: "diary", label: "Дневник" },
  { key: "step_completed", label: "Шаги" },
  { key: "assignment", label: "Назначения" },
  { key: "status_change", label: "Статусы" },
];

type EventsCtxValue = {
  userId: string;

  filter: "all" | ModeratorUserActivityType;
  setFilter: React.Dispatch<
    React.SetStateAction<"all" | ModeratorUserActivityType>
  >;

  items: IModeratorUserActivityItem[];
  filteredItems: IModeratorUserActivityItem[];

  loadState: LoadState;
  error: string | null;

  canLoadMore: boolean;
  isLoadingMore: boolean;

  openFeedback: (it: IModeratorUserActivityItem) => void;

  feedbackMap: Record<string, FeedbackItem[]>;
  activeFeedbackFor: string;
  feedbackText: string;
  setFeedbackText: React.Dispatch<React.SetStateAction<string>>;
  cancelFeedback: () => void;
  submitFeedback: (it: IModeratorUserActivityItem) => void;

  eventsScrollRef: React.RefObject<HTMLDivElement | null>;
  bottomSentinelRef: React.RefObject<HTMLDivElement | null>;

  loadNextPage: () => Promise<void>;
};

const EventsCtx = createContext<EventsCtxValue | null>(null);

function useEventsCtx() {
  const ctx = useContext(EventsCtx);
  if (!ctx) throw new Error("EventsCtx is not provided");
  return ctx;
}
function EventsPage() {
  const {
    filter,
    setFilter,
    filteredItems,
    loadState,
    error,
    canLoadMore,
    isLoadingMore,
    openFeedback,
    feedbackMap,
    activeFeedbackFor,
    feedbackText,
    setFeedbackText,
    cancelFeedback,
    submitFeedback,
    eventsScrollRef,
    bottomSentinelRef,
  } = useEventsCtx();

  const isLoading = loadState === "loading" && filteredItems.length === 0;
  const isError = loadState === "error";
  const isEmpty = loadState === "success" && filteredItems.length === 0;

  return (
    <section className={styles.page} aria-label="События">
      <div className={styles.eventsTop}>
        <div className={styles.filters} aria-label="Фильтр">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`${styles.filterBtn} ${
                filter === f.key ? styles.filterBtnActive : ""
              }`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.pageScroll} ref={eventsScrollRef}>
        {isLoading ? (
          <div className={styles.loadingBox}>
            <div className={styles.spinner} aria-hidden="true" />
            <p className={styles.loadingText}>Загрузка активности…</p>
          </div>
        ) : isError ? (
          <div className={styles.errorBox} role="alert">
            <p className={styles.errorTitle}>Не удалось загрузить</p>
            <p className={styles.errorText}>{error}</p>
          </div>
        ) : isEmpty ? (
          <p className={styles.empty}>Активности пока нет</p>
        ) : (
          <>
            <ul className={styles.list}>
              {filteredItems.map((it) => {
                const f = formatActivity(it);
                const feedbackList = feedbackMap[it.id] || [];
                const feedbackOpen = activeFeedbackFor === it.id;

                return (
                  <li
                    key={it.id}
                    className={`${styles.item} ${
                      f.targetType === "diary" ? styles.itemDiary : ""
                    }`}
                  >
                    <div className={styles.itemTop}>
                      <span className={styles.badge}>{f.badge}</span>
                      <span className={styles.date}>
                        {fmtDateTime(it.createdAt)}
                      </span>
                    </div>

                    <p className={styles.itemTitle}>{f.title}</p>
                    <p className={styles.itemSub}>{f.subtitle}</p>

                    <div className={styles.itemActions}>
                      <button
                        type="button"
                        className={styles.itemBtn}
                        onClick={() => openFeedback(it)}
                      >
                        Оставить feedback
                      </button>

                      {feedbackList.length > 0 ? (
                        <span className={styles.feedbackCount}>
                          Feedback: <b>{feedbackList.length}</b>
                        </span>
                      ) : (
                        <span className={styles.feedbackCountMuted}>
                          Feedback: 0
                        </span>
                      )}
                    </div>

                    {feedbackOpen ? (
                      <div className={styles.feedbackBox}>
                        <div className={styles.feedbackHead}>
                          <p className={styles.feedbackTitle}>
                            Feedback к событию: <b>{f.badge}</b>
                          </p>
                          <p className={styles.feedbackHint}>
                            Привязка:{" "}
                            <span className={styles.mono}>{it.id}</span>
                          </p>
                        </div>

                        <textarea
                          className={styles.textarea}
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          placeholder={
                            f.targetType === "diary"
                              ? "Комментарий к записи дневника: что улучшить, рекомендации, наблюдения…"
                              : f.targetType === "step_completed"
                                ? "Комментарий к выполнению шага: что сделано хорошо / что улучшить…"
                                : "Комментарий/рекомендации по событию…"
                          }
                        />

                        <div className={styles.feedbackBtns}>
                          <button
                            type="button"
                            className={styles.secondaryBtnSm}
                            onClick={cancelFeedback}
                          >
                            Отмена
                          </button>
                          <button
                            type="button"
                            className={styles.primaryBtnSm}
                            onClick={() => submitFeedback(it)}
                          >
                            Сохранить
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {feedbackList.length > 0 ? (
                      <div className={styles.feedbackHistory}>
                        <p className={styles.feedbackHistoryTitle}>
                          История feedback
                        </p>

                        <ul className={styles.feedbackList}>
                          {feedbackList.slice(0, 3).map((fb) => (
                            <li key={fb.id} className={styles.feedbackItem}>
                              <div className={styles.feedbackItemTop}>
                                <span className={styles.feedbackBadge}>
                                  MOD
                                </span>
                                <span className={styles.feedbackDate}>
                                  {fmtDateTime(fb.createdAtISO)}
                                </span>
                              </div>
                              <p className={styles.feedbackText}>
                                {fb.message}
                              </p>
                            </li>
                          ))}
                        </ul>

                        {feedbackList.length > 3 ? (
                          <p className={styles.feedbackMore}>
                            Показано 3 из {feedbackList.length}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            <div className={styles.bottomSentinel} ref={bottomSentinelRef} />

            <div className={styles.loadHint}>
              {isLoadingMore
                ? "Загрузка…"
                : canLoadMore
                  ? "Прокрутите вниз для подгрузки"
                  : "Больше нет"}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default function UserActivityModal({
  open,
  userId,
  title,
  onClose,
  initialLimit = 3,
  initialOffset = 0,
  onSubmitFeedback,
}: Props) {
  const toast = useToast();
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const [page, setPage] = useState<Page>("analytics");

  const [metaState, setMetaState] = useState<LoadState>("idle");
  const [metaError, setMetaError] = useState<string | null>(null);

  const [progress, setProgress] =
    useState<IModeratorUserProgressResponse | null>(null);
  const [treatment, setTreatment] =
    useState<IModeratorUserTreatmentResponse | null>(null);

  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<IModeratorUserActivityItem[]>([]);
  const [total, setTotal] = useState(0);

  const [limit, setLimit] = useState(initialLimit);
  const [offset, setOffset] = useState(initialOffset);

  const [filter, setFilter] = useState<"all" | ModeratorUserActivityType>(
    "all"
  );

  const [feedbackMap, setFeedbackMap] = useState<
    Record<string, FeedbackItem[]>
  >({});
  const [activeFeedbackFor, setActiveFeedbackFor] = useState<string>(""); 
  const [feedbackText, setFeedbackText] = useState<string>("");

  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  const limitRef = useRef(limit);
  const offsetRef = useRef(offset);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    limitRef.current = limit;
  }, [limit]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  const canLoadMore = items.length < total;
  const safeTitle = useMemo(() => title || "Активность", [title]);

  const reset = () => {
    setPage("analytics");

    setMetaState("idle");
    setMetaError(null);
    setProgress(null);
    setTreatment(null);

    setLoadState("idle");
    setError(null);
    setItems([]);
    setTotal(0);
    setLimit(initialLimit);
    setOffset(initialOffset);

    setFilter("all");

    setActiveFeedbackFor("");
    setFeedbackText("");
    setFeedbackMap({});

    loadingMoreRef.current = false;
  };

  const fetchMeta = async () => {
    if (!userId) return;

    setMetaState("loading");
    setMetaError(null);

    try {
      const [p, t] = await Promise.all([
        moderatorUsersService.getUserProgress(userId),
        moderatorUsersService.getUserTreatment(userId),
      ]);

      setProgress(p);
      setTreatment(t);
      setMetaState("success");
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Не удалось загрузить прогресс/лечение";
      const text = String(msg);
      setMetaError(text);
      setMetaState("error");
      toast.error(text);
    }
  };

  const fetchActivityPage = async (
    nextOffset: number,
    mode: "replace" | "append"
  ) => {
    if (!userId) return;

    setLoadState("loading");
    setError(null);

    try {
      const res: IModeratorUserActivityResponse =
        await moderatorUsersService.getUserActivity(userId, {
          limit: limitRef.current,
          offset: nextOffset,
        });

      setTotal(Number(res.total) || 0);

      if (mode === "replace") {
        setItems(res.items || []);
      } else {
        setItems((prev) => [...prev, ...(res.items || [])]);
      }

      setLoadState("success");
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Не удалось загрузить активность";
      const text = String(msg);
      setError(text);
      setLoadState("error");
      toast.error(text);
    }
  };

  const loadNextPage = async () => {
    if (!userId) return;
    if (loadingMoreRef.current) return;
    if (!canLoadMore) return;
    if (loadState === "loading") return;
    if (loadState === "error") return;

    loadingMoreRef.current = true;

    const next = offsetRef.current + limitRef.current;
    setOffset(next);
    await fetchActivityPage(next, "append");

    loadingMoreRef.current = false;
  };

  const onRetry = async () => {
    loadingMoreRef.current = false;
    setOffset(initialOffset);
    offsetRef.current = initialOffset;
    await Promise.all([
      fetchMeta(),
      fetchActivityPage(initialOffset, "replace"),
    ]);
  };

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }

    document.body.classList.add("modalOpen");

    const t = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(t);
      document.body.classList.remove("modalOpen");
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const startOffset = initialOffset;

    setLimit(initialLimit);
    limitRef.current = initialLimit;

    setOffset(startOffset);
    offsetRef.current = startOffset;

    fetchMeta();
    fetchActivityPage(startOffset, "replace");
  }, [open, userId, initialLimit, initialOffset]);

  const isLoadingMore = loadState === "loading" && items.length > 0;

  const overall = useMemo(() => {
    if (progress) {
      return {
        activeDiseases: safeNum(progress.activeDiseases),
        completedSteps: safeNum(progress.completedSteps),
        totalSteps: Math.max(0, safeNum(progress.totalSteps)),
        overallProgressPct: clampPct(safeNum(progress.overallProgressPct)),
        lastActivityAt: progress.lastActivityAt || "",
      };
    }

    if (treatment?.overall) {
      return {
        activeDiseases: safeNum(treatment.overall.activeDiseases),
        completedSteps: safeNum(treatment.overall.completedSteps),
        totalSteps: Math.max(0, safeNum(treatment.overall.totalSteps)),
        overallProgressPct: clampPct(
          safeNum(treatment.overall.overallProgressPct)
        ),
        lastActivityAt: treatment.overall.lastActivityAt || "",
      };
    }

    return null;
  }, [progress, treatment]);

  const diseases = useMemo<ITreatmentDiseaseItem[]>(
    () => treatment?.diseases?.items || [],
    [treatment]
  );

  const pieData = useMemo(() => {
    const done = overall ? safeNum(overall.completedSteps) : 0;
    const totalSteps = overall ? Math.max(0, safeNum(overall.totalSteps)) : 0;
    const left = Math.max(0, totalSteps - done);

    return [
      { name: "Выполнено", value: done },
      { name: "Осталось", value: left },
    ];
  }, [overall]);

  const barData = useMemo(() => {
    return diseases.map((d) => ({
      name:
        d.diseaseName.length > 16
          ? d.diseaseName.slice(0, 16) + "…"
          : d.diseaseName,
      fullName: d.diseaseName,
      progress: clampPct(safeNum(d.progressPercent)),
      organ: d.organName,
      status: d.status,
    }));
  }, [diseases]);

  const barMinWidth = useMemo(() => {
    const n = barData.length;
    const perBar = 84;
    return Math.max(560, n * perBar);
  }, [barData.length]);

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((it) => it.type === filter);
  }, [items, filter]);

  const openFeedback = (activityItem: IModeratorUserActivityItem) => {
    setActiveFeedbackFor(activityItem.id);
    setFeedbackText("");
    setPage("events");
  };

  const cancelFeedback = () => {
    setActiveFeedbackFor("");
    setFeedbackText("");
  };

  const submitFeedback = (activityItem: IModeratorUserActivityItem) => {
    const msg = (feedbackText ?? "").trim();
    if (!msg) {
      toast.error("Введите текст обратной связи");
      return;
    }

    const f = formatActivity(activityItem);

    const payload: FeedbackItem = {
      id: `${activityItem.id}_${Date.now()}`,
      userId,
      targetType: f.targetType,
      targetId: activityItem.id,
      message: msg,
      createdAtISO: new Date().toISOString(),
    };

    setFeedbackMap((prev) => {
      const next = { ...prev };
      const arr = next[activityItem.id] ? [...next[activityItem.id]] : [];
      arr.unshift(payload);
      next[activityItem.id] = arr;
      return next;
    });

    if (onSubmitFeedback) onSubmitFeedback(payload);

    toast.success("Feedback сохранён (локально)");
    setActiveFeedbackFor("");
    setFeedbackText("");
  };

  const onOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

 
  useEffect(() => {
    if (!open) return;
    if (page !== "events") return;

    const rootEl = eventsScrollRef.current;
    const sentinelEl = bottomSentinelRef.current;
    if (!rootEl || !sentinelEl) return;

    if (!canLoadMore) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;

        if (e.isIntersecting) {
          loadNextPage();
        }
      },
      {
        root: rootEl, 
        rootMargin: "220px", 
        threshold: 0.01,
      }
    );

    obs.observe(sentinelEl);

    return () => {
      obs.disconnect();
    };
  }, [open, page, canLoadMore, filter, items.length]);

  if (!open) return null;

  const eventsCtxValue: EventsCtxValue = {
    userId,

    filter,
    setFilter,

    items,
    filteredItems,

    loadState,
    error,

    canLoadMore,
    isLoadingMore,

    openFeedback,

    feedbackMap,
    activeFeedbackFor,
    feedbackText,
    setFeedbackText,
    cancelFeedback,
    submitFeedback,

    eventsScrollRef,
    bottomSentinelRef,

    loadNextPage,
  };

  return (
    <ModalPortal>
      <div
        className={styles.backdrop}
        role="dialog"
        aria-modal="true"
        aria-label={safeTitle}
        onMouseDown={onOverlayMouseDown}
      >
        <div className={styles.modal}>
          <header className={styles.head}>
            <div className={styles.headLeft}>
              <h3 className={styles.title}>{safeTitle}</h3>
              <p className={styles.subTitle}>
                Просмотр активности и прогресса участника
              </p>
            </div>

            <button
              ref={closeBtnRef}
              className={styles.closeBtn}
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
            >
              ✕
            </button>
          </header>

          {/* TABS */}
          <div
            className={styles.tabs}
            role="tablist"
            aria-label="Разделы модалки"
          >
            <button
              type="button"
              role="tab"
              aria-selected={page === "analytics"}
              className={`${styles.tabBtn} ${page === "analytics" ? styles.tabBtnActive : ""}`}
              onClick={() => setPage("analytics")}
            >
              Аналитика
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={page === "events"}
              className={`${styles.tabBtn} ${page === "events" ? styles.tabBtnActive : ""}`}
              onClick={() => setPage("events")}
            >
              События
            </button>
          </div>

          <div className={styles.content}>
            {/* PAGE: ANALYTICS */}
            {page === "analytics" ? (
              <section className={styles.page} aria-label="Аналитика">
                <div className={styles.pageScroll}>
                  {metaState === "loading" && !overall ? (
                    <div className={styles.loadingBox}>
                      <div className={styles.spinner} aria-hidden="true" />
                      <p className={styles.loadingText}>Загрузка прогресса…</p>
                    </div>
                  ) : metaState === "error" ? (
                    <div className={styles.errorBox} role="alert">
                      <p className={styles.errorTitle}>
                        Не удалось загрузить прогресс
                      </p>
                      <p className={styles.errorText}>{metaError}</p>
                      <button
                        className={styles.retryBtn}
                        type="button"
                        onClick={onRetry}
                      >
                        Повторить
                      </button>
                    </div>
                  ) : overall ? (
                    <>
                      <div className={styles.summaryGrid}>
                        <div className={styles.summaryCard}>
                          <p className={styles.summaryLabel}>
                            Активные проблемы
                          </p>
                          <p className={styles.summaryValue}>
                            {overall.activeDiseases}
                          </p>
                        </div>

                        <div className={styles.summaryCard}>
                          <p className={styles.summaryLabel}>Шаги</p>
                          <p className={styles.summaryValue}>
                            {overall.completedSteps}/{overall.totalSteps}
                          </p>
                        </div>

                        <div className={styles.summaryCard}>
                          <p className={styles.summaryLabel}>Общий прогресс</p>
                          <p className={styles.summaryValue}>
                            {overall.overallProgressPct}%
                          </p>
                        </div>

                        <div className={styles.summaryCard}>
                          <p className={styles.summaryLabel}>
                            Последняя активность
                          </p>
                          <p className={styles.summaryValueSm}>
                            {overall.lastActivityAt
                              ? fmtDateTime(overall.lastActivityAt)
                              : "—"}
                          </p>
                        </div>
                      </div>

                      <div className={styles.chartsGrid}>
                        <div className={styles.chartCard}>
                          <div className={styles.chartHead}>
                            <p className={styles.chartTitle}>
                              Шаги (выполнено/осталось)
                            </p>
                            <p className={styles.chartHint}>Диаграмма</p>
                          </div>

                          <div className={styles.chartBox}>
                            <ResponsiveContainer width="100%" height={260}>
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  dataKey="value"
                                  nameKey="name"
                                  innerRadius={62}
                                  outerRadius={92}
                                  paddingAngle={2}
                                >
                                  <Cell fill="rgba(255,255,255,0.92)" />
                                  <Cell fill="rgba(255,255,255,0.16)" />
                                </Pie>

                                <Tooltip
                                  contentStyle={{
                                    background: "rgba(0,0,0,0.92)",
                                    border: "1px solid rgba(255,255,255,0.14)",
                                    borderRadius: 12,
                                    color: "rgba(255,255,255,0.92)",
                                    fontSize: 12,
                                  }}
                                  labelStyle={{
                                    color: "rgba(255,255,255,0.92)",
                                  }}
                                  itemStyle={{
                                    color: "rgba(255,255,255,0.92)",
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className={styles.chartCard}>
                          <div className={styles.chartHead}>
                            <p className={styles.chartTitle}>
                              Прогресс по болезням
                            </p>
                            <p className={styles.chartHint}>%</p>
                          </div>

                          <div className={styles.chartBox}>
                            {barData.length === 0 ? (
                              <p className={styles.emptySmall}>Нет болезней</p>
                            ) : (
                              <div className={styles.barScroll}>
                                <div
                                  className={styles.barInner}
                                  style={{ minWidth: barMinWidth }}
                                >
                                  <ResponsiveContainer
                                    width="100%"
                                    height={280}
                                  >
                                    <BarChart
                                      data={barData}
                                      margin={{
                                        top: 10,
                                        right: 14,
                                        left: 0,
                                        bottom: 54,
                                      }}
                                    >
                                      <CartesianGrid
                                        stroke="rgba(255,255,255,0.10)"
                                        strokeDasharray="3 3"
                                      />
                                      <XAxis
                                        dataKey="name"
                                        interval={0}
                                        angle={-28}
                                        textAnchor="end"
                                        height={60}
                                        tick={{
                                          fill: "rgba(255,255,255,0.92)",
                                          fontSize: 11,
                                        }}
                                        axisLine={{
                                          stroke: "rgba(255,255,255,0.14)",
                                        }}
                                        tickLine={{
                                          stroke: "rgba(255,255,255,0.14)",
                                        }}
                                      />
                                      <YAxis
                                        domain={[0, 100]}
                                        tick={{
                                          fill: "rgba(255,255,255,0.92)",
                                          fontSize: 11,
                                        }}
                                        axisLine={{
                                          stroke: "rgba(255,255,255,0.14)",
                                        }}
                                        tickLine={{
                                          stroke: "rgba(255,255,255,0.14)",
                                        }}
                                      />
                                      <Tooltip
                                        contentStyle={{
                                          background: "rgba(0,0,0,0.92)",
                                          border:
                                            "1px solid rgba(255,255,255,0.14)",
                                          borderRadius: 12,
                                          color: "rgba(255,255,255,0.92)",
                                          fontSize: 12,
                                        }}
                                        labelStyle={{
                                          color: "rgba(255,255,255,0.92)",
                                        }}
                                        itemStyle={{
                                          color: "rgba(255,255,255,0.92)",
                                        }}
                                        formatter={(
                                          value: any,
                                          _name: any,
                                          props: any
                                        ) => {
                                          const v = clampPct(safeNum(value));
                                          const fullName = safeStr(
                                            props?.payload?.fullName
                                          );
                                          const organ = safeStr(
                                            props?.payload?.organ
                                          );
                                          const status = safeStr(
                                            props?.payload?.status
                                          );
                                          return [
                                            `${v}% · ${organ} · ${status}`,
                                            fullName || "Прогресс",
                                          ];
                                        }}
                                      />
                                      <Bar
                                        dataKey="progress"
                                        fill="rgba(255,255,255,0.92)"
                                        radius={[10, 10, 0, 0]}
                                      />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </section>
            ) : null}

            {/* PAGE: EVENTS (Context) */}
            {page === "events" ? (
              <EventsCtx.Provider value={eventsCtxValue}>
                <EventsPage />
              </EventsCtx.Provider>
            ) : null}
          </div>

          {/* FOOTER (без кнопки load more) */}
          <footer className={styles.footer}>
            <button
              className={styles.secondaryBtn}
              type="button"
              onClick={onClose}
            >
              Закрыть
            </button>
          </footer>
        </div>
      </div>
    </ModalPortal>
  );
}
