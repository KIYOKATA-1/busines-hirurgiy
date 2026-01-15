"use client";

import { useEffect, useMemo, useState } from "react";
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

type Props = {
  open: boolean;
  userId: string;
  title: string;
  onClose: () => void;

  initialLimit?: number;
  initialOffset?: number;
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
    };
  }

  if (item.type === "step_completed") {
    return {
      badge: "Шаг",
      title: "Шаг выполнен",
      subtitle: `stepId: ${item.payload.stepId} · userDiseaseId: ${item.payload.userDiseaseId}`,
    };
  }

  if (item.type === "status_change") {
    return {
      badge: "Статус",
      title: `Статус: ${item.payload.to}`,
      subtitle: `Причина: ${item.payload.reason} · userDiseaseId: ${item.payload.userDiseaseId}`,
    };
  }

  return {
    badge: "Дневник",
    title: `Запись дневника · mood: ${item.payload.mood}`,
    subtitle: `Теги: ${(item.payload.tags || []).join(", ") || "—"} · ${ellipsize(
      item.payload.text,
      220
    )}`,
  };
}

const FILTERS: Array<{ key: "all" | ModeratorUserActivityType; label: string }> = [
  { key: "all", label: "Все" },
  { key: "diary", label: "Дневник" },
  { key: "step_completed", label: "Шаги" },
  { key: "assignment", label: "Назначения" },
  { key: "status_change", label: "Статусы" },
];

export default function UserActivityModal({
  open,
  userId,
  title,
  onClose,
  initialLimit = 20,
  initialOffset = 0,
}: Props) {
  const toast = useToast();

  const [metaState, setMetaState] = useState<LoadState>("idle");
  const [metaError, setMetaError] = useState<string | null>(null);

  const [progress, setProgress] = useState<IModeratorUserProgressResponse | null>(null);
  const [treatment, setTreatment] = useState<IModeratorUserTreatmentResponse | null>(null);

  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<IModeratorUserActivityItem[]>([]);
  const [total, setTotal] = useState(0);

  const [limit, setLimit] = useState(initialLimit);
  const [offset, setOffset] = useState(initialOffset);

  const [filter, setFilter] = useState<"all" | ModeratorUserActivityType>("all");

  const canLoadMore = items.length < total;

  const safeTitle = useMemo(() => title || "Активность", [title]);

  const reset = () => {
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
        e?.response?.data?.message || e?.message || "Не удалось загрузить прогресс/лечение";
      const text = String(msg);
      setMetaError(text);
      setMetaState("error");
      toast.error(text);
    }
  };

  const fetchActivityPage = async (nextOffset: number, mode: "replace" | "append") => {
    if (!userId) return;

    setLoadState("loading");
    setError(null);

    try {
      const res: IModeratorUserActivityResponse = await moderatorUsersService.getUserActivity(
        userId,
        { limit, offset: nextOffset }
      );

      setTotal(Number(res.total) || 0);

      if (mode === "replace") {
        setItems(res.items || []);
      } else {
        setItems((prev) => [...prev, ...(res.items || [])]);
      }

      setLoadState("success");
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Не удалось загрузить активность";
      const text = String(msg);
      setError(text);
      setLoadState("error");
      toast.error(text);
    }
  };

  const onLoadMore = async () => {
    const next = offset + limit;
    setOffset(next);
    await fetchActivityPage(next, "append");
  };

  const onRetry = async () => {
    setOffset(initialOffset);
    await Promise.all([fetchMeta(), fetchActivityPage(initialOffset, "replace")]);
  };

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }

    const startOffset = initialOffset;

    setLimit(initialLimit);
    setOffset(startOffset);

    fetchMeta();
    fetchActivityPage(startOffset, "replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId, initialLimit, initialOffset]);

  const isLoading = loadState === "loading";
  const isError = loadState === "error";
  const isSuccess = loadState === "success";

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
        overallProgressPct: clampPct(safeNum(treatment.overall.overallProgressPct)),
        lastActivityAt: treatment.overall.lastActivityAt || "",
      };
    }

    return null;
  }, [progress, treatment]);

  const diseases = useMemo<ITreatmentDiseaseItem[]>(() => {
    return treatment?.diseases?.items || [];
  }, [treatment]);

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
      name: d.diseaseName.length > 18 ? d.diseaseName.slice(0, 18) + "…" : d.diseaseName,
      fullName: d.diseaseName,
      progress: clampPct(safeNum(d.progressPercent)),
      organ: d.organName,
      status: d.status,
    }));
  }, [diseases]);

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((it) => it.type === filter);
  }, [items, filter]);

  const empty = isSuccess && items.length === 0;

  if (!open) return null;

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <header className={styles.head}>
          <div className={styles.headLeft}>
            <h3 className={styles.title}>{safeTitle}</h3>
          </div>

          <button className={styles.closeBtn} type="button" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </header>

        <section className={styles.meta}>
          {metaState === "loading" && !overall ? (
            <div className={styles.loadingBox}>
              <div className={styles.spinner} aria-hidden="true" />
              <p className={styles.loadingText}>Загрузка прогресса…</p>
            </div>
          ) : metaState === "error" ? (
            <div className={styles.errorBox} role="alert">
              <p className={styles.errorTitle}>Не удалось загрузить прогресс</p>
              <p className={styles.errorText}>{metaError}</p>
              <button className={styles.retryBtn} type="button" onClick={onRetry}>
                Повторить
              </button>
            </div>
          ) : overall ? (
            <>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <p className={styles.summaryLabel}>Активные проблемы</p>
                  <p className={styles.summaryValue}>{overall.activeDiseases}</p>
                </div>

                <div className={styles.summaryCard}>
                  <p className={styles.summaryLabel}>Шаги</p>
                  <p className={styles.summaryValue}>
                    {overall.completedSteps}/{overall.totalSteps}
                  </p>
                </div>

                <div className={styles.summaryCard}>
                  <p className={styles.summaryLabel}>Общий прогресс</p>
                  <p className={styles.summaryValue}>{overall.overallProgressPct}%</p>
                </div>

                <div className={styles.summaryCard}>
                  <p className={styles.summaryLabel}>Последняя активность</p>
                  <p className={styles.summaryValueSm}>
                    {overall.lastActivityAt ? fmtDateTime(overall.lastActivityAt) : "—"}
                  </p>
                </div>
              </div>

              <div className={styles.chartsGrid}>
                <div className={`${styles.chartCard} ${styles.chart}`}>
                  <div className={styles.chartHead}>
                    <p className={styles.chartTitle}>Шаги (выполнено/осталось)</p>
                    <p className={styles.chartHint}>Диаграмма</p>
                  </div>

                  <div className={styles.chartBox}>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={56}
                          outerRadius={82}
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
                          labelStyle={{ color: "rgba(255,255,255,0.92)" }}
                          itemStyle={{ color: "rgba(255,255,255,0.92)" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={`${styles.chartCard} ${styles.chart}`}>
                  <div className={styles.chartHead}>
                    <p className={styles.chartTitle}>Прогресс по болезням</p>
                    <p className={styles.chartHint}>%</p>
                  </div>

                  <div className={styles.chartBox}>
                    {barData.length === 0 ? (
                      <p className={styles.emptySmall}>Нет болезней</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={barData}>
                          <CartesianGrid stroke="rgba(255,255,255,0.10)" strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: "rgba(255,255,255,0.92)", fontSize: 11 }}
                            axisLine={{ stroke: "rgba(255,255,255,0.14)" }}
                            tickLine={{ stroke: "rgba(255,255,255,0.14)" }}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tick={{ fill: "rgba(255,255,255,0.92)", fontSize: 11 }}
                            axisLine={{ stroke: "rgba(255,255,255,0.14)" }}
                            tickLine={{ stroke: "rgba(255,255,255,0.14)" }}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "rgba(0,0,0,0.92)",
                              border: "1px solid rgba(255,255,255,0.14)",
                              borderRadius: 12,
                              color: "rgba(255,255,255,0.92)",
                              fontSize: 12,
                            }}
                            labelStyle={{ color: "rgba(255,255,255,0.92)" }}
                            itemStyle={{ color: "rgba(255,255,255,0.92)" }}
                            formatter={(value: any, _name: any, props: any) => {
                              const v = clampPct(safeNum(value));
                              const fullName = props?.payload?.fullName;
                              const organ = props?.payload?.organ;
                              const status = props?.payload?.status;
                              return [`${v}% · ${organ} · ${status}`, fullName || "Прогресс"];
                            }}
                          />
                          <Bar dataKey="progress" fill="rgba(255,255,255,0.92)" radius={[10, 10, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </section>

        <section className={styles.filters} aria-label="Фильтр">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`${styles.filterBtn} ${filter === f.key ? styles.filterBtnActive : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </section>

        <section className={styles.body}>
          {isLoading && items.length === 0 ? (
            <div className={styles.loadingBox}>
              <div className={styles.spinner} aria-hidden="true" />
              <p className={styles.loadingText}>Загрузка активности…</p>
            </div>
          ) : isError ? (
            <div className={styles.errorBox} role="alert">
              <p className={styles.errorTitle}>Не удалось загрузить</p>
              <p className={styles.errorText}>{error}</p>
              <button className={styles.retryBtn} type="button" onClick={onRetry}>
                Повторить
              </button>
            </div>
          ) : empty ? (
            <p className={styles.empty}>Активности пока нет</p>
          ) : filteredItems.length === 0 ? (
            <p className={styles.empty}>По фильтру событий нет</p>
          ) : (
            <ul className={styles.list}>
              {filteredItems.map((it) => {
                const f = formatActivity(it);
                return (
                  <li key={it.id} className={styles.item}>
                    <div className={styles.itemTop}>
                      <span className={styles.badge}>{f.badge}</span>
                      <span className={styles.date}>{fmtDateTime(it.createdAt)}</span>
                    </div>
                    <p className={styles.itemTitle}>{f.title}</p>
                    <p className={styles.itemSub}>{f.subtitle}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <footer className={styles.footer}>
          <button className={styles.secondaryBtn} type="button" onClick={onClose} disabled={isLoading}>
            Закрыть
          </button>

          <button
            className={styles.primaryBtn}
            type="button"
            onClick={onLoadMore}
            disabled={!canLoadMore || isLoading || isError}
          >
            {isLoading && items.length > 0 ? "Загрузка…" : canLoadMore ? "Показать ещё" : "Больше нет"}
          </button>
        </footer>
      </div>
    </div>
  );
}
