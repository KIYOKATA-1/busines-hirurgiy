// ActivityDiary.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./ActivityDiary.module.scss";
import AddDiaryEntryModal from "./components/AddDiaryEntryModal/AddDiaryEntryModal";

import { useToast } from "@/app/components/Toast/ToastProvider";

import { userDiseasesService } from "@/services/userDiseases/userDiseases.service";
import type {
  IUserDiseaseItem,
  IUserDiseaseStepItem,
  UserStepState,
} from "@/services/userDiseases/userDiseases.types";
import { ActivityDiaryIcon, BackIcon } from "@/shared/ui/icons";
import { CheckIcon } from "@/shared/ui/icons/CheckIcon";
import { ChatIcon } from "@/shared/ui/icons/ChatIcon";


type StatItem = {
  title: string;
  value: number;
  icon: "calendar" | "check" | "chat";
};

type ViewMode = "diseases" | "steps";

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

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

export default function ActivityDiary() {
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [presetTags, setPresetTags] = useState<string[]>([]);
  const [presetTitle, setPresetTitle] = useState<string | null>(null);

  const stats: StatItem[] = useMemo(
    () => [
      { title: "Ожидают проверки", value: 0, icon: "calendar" },
      { title: "Нужна доработка", value: 0, icon: "check" },
      { title: "Есть ответ", value: 0, icon: "chat" },
    ],
    []
  );

  const [view, setView] = useState<ViewMode>("diseases");

  const [diseasesLoading, setDiseasesLoading] = useState(false);
  const [diseases, setDiseases] = useState<IUserDiseaseItem[]>([]);
  const [selectedDisease, setSelectedDisease] = useState<IUserDiseaseItem | null>(null);

  const [stepsLoading, setStepsLoading] = useState(false);
  const [steps, setSteps] = useState<IUserDiseaseStepItem[]>([]);
  const [completeLoadingId, setCompleteLoadingId] = useState<string | null>(null);

  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const raf1 = useRef<number | null>(null);
  const raf2 = useRef<number | null>(null);

  const [viewHeight, setViewHeight] = useState<number | "auto">("auto");
  const [heightAnimating, setHeightAnimating] = useState(false);

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

  const loadDiseases = useCallback(async () => {
    try {
      setDiseasesLoading(true);
      const res = await userDiseasesService.getMyDiseases();
      const items = res.items ?? [];
      setDiseases(items);

      if (!selectedDisease && items.length > 0) {
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
  }, [toast, selectedDisease]);

  const loadSteps = useCallback(
    async (userDiseaseId: string) => {
      try {
        setStepsLoading(true);
        const res = await userDiseasesService.getStepsByUserDiseaseId(userDiseaseId);
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

  useEffect(() => {
    loadDiseases();
  }, []);

  useEffect(() => {
    if (!selectedDisease?.userDiseaseId) return;
    if (view !== "steps") return;
    loadSteps(selectedDisease.userDiseaseId);
  }, [selectedDisease?.userDiseaseId, loadSteps, view]);

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

  const onCompleteStep = useCallback(
    async (userStepId: string) => {
      if (!selectedDisease) return;

      try {
        setCompleteLoadingId(userStepId);
        await userDiseasesService.completeStep(userStepId);
        toast.success("Шаг выполнен");

        await loadSteps(selectedDisease.userDiseaseId);
        await loadDiseases();
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

  const openReportModal = (opts?: { disease?: IUserDiseaseItem | null; step?: IUserDiseaseStepItem | null }) => {
    const diseaseName = opts?.disease?.diseaseName;
    const userDiseaseId = opts?.disease?.userDiseaseId;

    const stepId = opts?.step?.stepId;
    const userStepId = opts?.step?.id;

    const tags: string[] = [];

    if (diseaseName) tags.push(`disease:${diseaseName}`);
    if (userDiseaseId) tags.push(`userDiseaseId:${userDiseaseId}`);
    if (stepId != null) tags.push(`stepId:${String(stepId)}`);
    if (userStepId) tags.push(`userStepId:${userStepId}`);

    setPresetTags(tags);
    setPresetTitle(
      diseaseName
        ? stepId != null
          ? `Отчёт по шагу • ${diseaseName} • StepId ${String(stepId)}`
          : `Отчёт • ${diseaseName}`
        : "Новая запись"
    );

    setOpen(true);
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
        {stats.map((s) => (
          <div key={s.title} className={styles.statCard}>
            <div className={styles.statHead}>
              <span className={styles.statIco} aria-hidden="true">
                <StatIcon kind={s.icon} />
              </span>
              <span className={styles.statTitle}>{s.title}</span>
            </div>
            <div className={styles.statValue}>{s.value}</div>
          </div>
        ))}
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div className={styles.panelHeadLeft}>
            <div className={styles.panelTitle}>{view === "steps" ? "Шаги" : "Болезни"}</div>

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
                    loadSteps(selectedDisease.userDiseaseId);
                  }}
                  disabled={stepsLoading || !selectedDisease?.userDiseaseId}
                >
                  {stepsLoading ? "..." : "Обновить"}
                </button>
              </>
            ) : (
              <button
                type="button"
                className={styles.smallBtn}
                onClick={loadDiseases}
                disabled={diseasesLoading}
              >
                {diseasesLoading ? "..." : "Обновить"}
              </button>
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
                  <div className={styles.diseaseGrid}>
                    {diseases.map((d) => {
                      const active = selectedDisease?.userDiseaseId === d.userDiseaseId;
                      const pct = clampPct(d.progressPercent ?? 0);

                      return (
                        <button
                          key={d.userDiseaseId}
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
                                {Math.max(0, Number(d.completedSteps ?? 0))}/{Math.max(0, Number(d.totalSteps ?? 0))} шагов
                              </span>
                              <span className={styles.diseaseProgPct}>{pct}%</span>
                            </div>

                            <div className={styles.progressBar}>
                              <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
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
                    <div className={styles.emptyTitle}>Шагов нет</div>
                    <div className={styles.emptyText}>API не вернул user_steps для этой болезни.</div>
                  </div>
                ) : (
                  <div className={styles.stepsList}>
                    {steps.map((s, idx) => {
                      const done = isCompleted(s.state);
                      const completing = completeLoadingId === s.id;

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

                            <span className={styles.badge}>{stateLabel(s.state)}</span>
                          </div>

                          <div className={styles.stepActions}>
                            <button
                              type="button"
                              className={styles.secondaryBtn}
                              onClick={() => openReportModal({ disease: selectedDisease, step: s })}
                              disabled={!selectedDisease}
                            >
                              Отчитаться
                            </button>

                            <button
                              type="button"
                              className={styles.primaryBtn}
                              onClick={() => onCompleteStep(s.id)}
                              disabled={done || completing}
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
            )}
          </div>
        </div>
      </section>

      <AddDiaryEntryModal
        open={open}
        onClose={() => setOpen(false)}
        presetTitle={presetTitle}
        presetTags={presetTags}
      />
    </div>
  );
}
