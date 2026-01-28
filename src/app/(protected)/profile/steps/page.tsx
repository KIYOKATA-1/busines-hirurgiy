"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";

import Header from "@/app/components/Header/Header";
import FloatingBurgerMenu from "@/app/components/FloatingBurgerMenu/FloatingBurgerMenu";
import type { Role } from "@/app/components/Tablet/Tablet";

import { useToast } from "@/app/components/Toast/ToastProvider";
import { CheckIcon } from "@/shared/ui/icons/CheckIcon";

import styles from "./steps.module.scss";

import { userDiseasesService } from "@/services/userDiseases/userDiseases.service";
import type {
  IUserDiseaseItem,
  IUserDiseaseStepItem,
  UserStepState,
} from "@/services/userDiseases/userDiseases.types";
import {
  normalizeStepStateValue,
  STEP_STATE_VALUES,
  stepStateToCode,
} from "@/services/userDiseases/userDiseases.state";
import type { IUserMe } from "@/services/user/user.types";

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function clampPct(v: number) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function isResolved(status?: string | null) {
  const s = String(status ?? "").toLowerCase();
  return s === "resolved" || s === "done" || s === "completed";
}

function stateLabel(s: UserStepState) {
  const v = String(s || "").toLowerCase();
  if (v === "completed") return "Завершено";
  if (v === "active") return "В процессе";
  if (v === "pending") return "Ожидает";
  return s || "—";
}

function stateClass(s: UserStepState) {
  const v = String(s || "").toLowerCase();
  if (v === "completed") return styles.badgeDone;
  if (v === "active") return styles.badgeActive;
  if (v === "pending") return styles.badgePending;
  return styles.badgeNeutral;
}

const DEFAULT_STEPS_LIMIT = 50;

export default function ProfileStepsPage() {
  const router = useRouter();
  const toast = useToast();
  const { initialized, loading, isAuth, user, logout } = useSession();

  const [diseasesLoading, setDiseasesLoading] = useState(false);
  const [diseases, setDiseases] = useState<IUserDiseaseItem[]>([]);

  const [selected, setSelected] = useState<IUserDiseaseItem | null>(null);

  const [stepsLoading, setStepsLoading] = useState(false);
  const [steps, setSteps] = useState<IUserDiseaseStepItem[]>([]);

  const [completeLoadingId, setCompleteLoadingId] = useState<string | null>(
    null
  );
  const [stateLoadingId, setStateLoadingId] = useState<string | null>(null);
  const [resolveLoading, setResolveLoading] = useState(false);

  useEffect(() => {
    if (!initialized) return;
    if (!isAuth) router.replace("/login");
  }, [initialized, isAuth, router]);

  const role: Role = useMemo(() => {
    const r = user?.role;
    if (r === "admin" || r === "moderator") return r;
    return "participant";
  }, [user?.role]);

  const headerUser = useMemo<IUserMe | null>(() => {
    if (!user) return null;
    return user as unknown as IUserMe;
  }, [user]);

  const loadDiseases = useCallback(
    async (keepSelectedUserDiseaseId?: string | null) => {
      try {
        setDiseasesLoading(true);
        const res = await userDiseasesService.getMyDiseases();
        const items = res.items ?? [];
        setDiseases(items);

        if (keepSelectedUserDiseaseId) {
          const found =
            items.find((x) => x.userDiseaseId === keepSelectedUserDiseaseId) ??
            null;
          setSelected(found);
        }
      } catch (e: unknown) {
        const err = e as {
          response?: { data?: { message?: unknown; detail?: unknown } };
          message?: unknown;
        };

        const msg =
          err?.response?.data?.message ??
          err?.response?.data?.detail ??
          err?.message ??
          "Не удалось загрузить болезни.";

        toast.error(String(msg));
      } finally {
        setDiseasesLoading(false);
      }
    },
    [toast]
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
      } catch (e: unknown) {
        const err = e as {
          response?: { data?: { message?: unknown; detail?: unknown } };
          message?: unknown;
        };

        const msg =
          err?.response?.data?.message ??
          err?.response?.data?.detail ??
          err?.message ??
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
    if (!initialized || !isAuth) return;
    loadDiseases(null);
  }, [initialized, isAuth, loadDiseases]);

  const onContinue = useCallback(
    async (d: IUserDiseaseItem) => {
      setSelected(d);
      setSteps([]);
      await loadSteps(d.userDiseaseId, d.totalSteps);
    },
    [loadSteps]
  );

  const onCompleteStep = useCallback(
    async (userStepId: string) => {
      if (!selected) return;

      try {
        setCompleteLoadingId(userStepId);
        await userDiseasesService.completeStep(userStepId);
        toast.success("Шаг выполнен");

        await loadSteps(selected.userDiseaseId, selected.totalSteps);
        await loadDiseases(selected.userDiseaseId);
      } catch (e: unknown) {
        const err = e as {
          response?: { data?: { message?: unknown; detail?: unknown } };
          message?: unknown;
        };

        const msg =
          err?.response?.data?.message ??
          err?.response?.data?.detail ??
          err?.message ??
          "Ошибка выполнения шага.";

        toast.error(String(msg));
      } finally {
        setCompleteLoadingId(null);
      }
    },
    [selected, toast, loadSteps, loadDiseases]
  );

  const onChangeStepState = useCallback(
    async (userStepId: string, nextState: UserStepState) => {
      if (!selected) return;

      try {
        setStateLoadingId(userStepId);
        await userDiseasesService.updateStepState(
          userStepId,
          stepStateToCode(nextState)
        );
        toast.success("Статус шага обновлён");

        await loadSteps(selected.userDiseaseId, selected.totalSteps);
        await loadDiseases(selected.userDiseaseId);
      } catch (e: unknown) {
        const err = e as {
          response?: { data?: { message?: unknown; detail?: unknown } };
          message?: unknown;
        };

        const msg =
          err?.response?.data?.message ??
          err?.response?.data?.detail ??
          err?.message ??
          "Ошибка обновления статуса шага.";

        toast.error(String(msg));
      } finally {
        setStateLoadingId(null);
      }
    },
    [selected, toast, loadSteps, loadDiseases]
  );

  const onResolveDisease = useCallback(async () => {
    if (!selected) return;

    try {
      setResolveLoading(true);
      await userDiseasesService.resolveDisease(selected.userDiseaseId);
      toast.success("Болезнь завершена");

      await loadSteps(selected.userDiseaseId, selected.totalSteps);
      await loadDiseases(selected.userDiseaseId);
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { message?: unknown; detail?: unknown } };
        message?: unknown;
      };

      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.detail ??
        err?.message ??
        "Ошибка завершения болезни.";

      toast.error(String(msg));
    } finally {
      setResolveLoading(false);
    }
  }, [selected, toast, loadSteps, loadDiseases]);

  if (!initialized || loading) {
    return (
      <div className={styles.loader}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!isAuth) return null;

  const selectedResolved = isResolved(selected?.status ?? null);

  return (
    <div className={styles.page}>
      <Header user={headerUser} onLogout={logout} />

      <main className={styles.main}>
        <div className={styles.container}>
          <section className={styles.shell}>
            <header className={styles.top}>
              <div className={styles.topLeft}>
                <h1 className={styles.title}>Шаги</h1>
                <p className={styles.subtitle}>
                  Работаем строго по user diseases / user steps
                </p>
              </div>

              <div className={styles.topRight}>
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => router.push("/profile")}
                >
                  Назад
                </button>

                <button
                  type="button"
                  className={styles.refreshBtn}
                  onClick={() => loadDiseases(selected?.userDiseaseId ?? null)}
                  disabled={diseasesLoading}
                >
                  {diseasesLoading ? "Обновление..." : "Обновить"}
                </button>
              </div>
            </header>

            <div className={styles.layout}>
              <section className={styles.left}>
                <div className={styles.blockHead}>
                  <h2 className={styles.blockTitle}>Мои болезни</h2>
                  <p className={styles.blockHint}>
                    Нажмите “Продолжить”, чтобы загрузить шаги
                  </p>
                </div>

                {diseasesLoading ? (
                  <div className={styles.skeletonList}>
                    <div className={styles.skeletonCard} />
                    <div className={styles.skeletonCard} />
                    <div className={styles.skeletonCard} />
                  </div>
                ) : diseases.length === 0 ? (
                  <div className={styles.empty}>
                    <div className={styles.emptyTitle}>Нет болезней</div>
                    <div className={styles.emptyText}>
                      Когда болезнь будет назначена, она появится тут.
                    </div>
                  </div>
                ) : (
                  <div className={styles.cards}>
                    {diseases.map((d) => {
                      const isSelected =
                        selected?.userDiseaseId === d.userDiseaseId;
                      const pct = clampPct(d.progressPercent ?? 0);

                      return (
                        <article
                          key={d.userDiseaseId}
                          className={[
                            styles.card,
                            isSelected ? styles.cardActive : "",
                          ].join(" ")}
                        >
                          <div className={styles.cardTop}>
                            <div className={styles.cardMeta}>
                              <div className={styles.cardTitleRow}>
                                <h3 className={styles.cardTitle}>
                                  {d.diseaseName}
                                </h3>
                                <span className={styles.cardStatus}>
                                  {String(d.status || "—")}
                                </span>
                              </div>

                              <div className={styles.cardSubRow}>
                                <span className={styles.chip}>
                                  {d.categoryName}
                                </span>
                                <span className={styles.chipMuted}>
                                  {d.organName}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className={styles.progressRow}>
                            <div className={styles.progressMeta}>
                              <span className={styles.progressText}>
                                {Math.max(0, Number(d.completedSteps ?? 0))}/
                                {Math.max(0, Number(d.totalSteps ?? 0))} шагов
                              </span>
                              <span className={styles.progressPct}>{pct}%</span>
                            </div>

                            <div className={styles.progressBar}>
                              <div
                                className={styles.progressFill}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          <div className={styles.cardBottom}>
                            <div className={styles.cardDates}>
                              <div className={styles.dateLine}>
                                <span className={styles.dateLabel}>Старт:</span>
                                <span className={styles.dateValue}>
                                  {fmtDate(d.startedAt)}
                                </span>
                              </div>
                              <div className={styles.dateLine}>
                                <span className={styles.dateLabel}>
                                  Обновлено:
                                </span>
                                <span className={styles.dateValue}>
                                  {fmtDate(d.updatedAt)}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              className={styles.continueBtn}
                              onClick={() => onContinue(d)}
                              disabled={stepsLoading && isSelected}
                            >
                              {stepsLoading && isSelected
                                ? "Загрузка..."
                                : "Продолжить"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className={styles.right}>
                <div className={styles.rightHeadRow}>
                  <div className={styles.blockHead}>
                    <h2 className={styles.blockTitle}>Шаги болезни</h2>
                    <p className={styles.blockHint}>
                      {selected
                        ? `${selected.diseaseName} • ${clampPct(selected.progressPercent ?? 0)}%`
                        : "Выберите болезнь слева"}
                    </p>
                  </div>

                  {selected ? (
                    <div className={styles.rightActions}>
                      <span
                        className={[
                          styles.diseaseBadge,
                          selectedResolved
                            ? styles.diseaseBadgeDone
                            : styles.diseaseBadgeActive,
                        ].join(" ")}
                      >
                        {selectedResolved ? "Завершено" : "Активно"}
                      </span>

                      <button
                        type="button"
                        className={styles.resolveBtn}
                        onClick={onResolveDisease}
                        disabled={selectedResolved || resolveLoading}
                        title={
                          selectedResolved
                            ? "Уже завершено"
                            : "Завершить болезнь"
                        }
                      >
                        {resolveLoading ? "Завершение..." : "Завершить"}
                      </button>
                    </div>
                  ) : null}
                </div>

                {!selected ? (
                  <div className={styles.placeholder}>
                    <div className={styles.placeholderTitle}>
                      Нет выбранной болезни
                    </div>
                    <div className={styles.placeholderText}>
                      Нажмите “Продолжить”, чтобы загрузить шаги.
                    </div>
                  </div>
                ) : stepsLoading ? (
                  <div className={styles.skeletonSteps}>
                    <div className={styles.skeletonStep} />
                    <div className={styles.skeletonStep} />
                    <div className={styles.skeletonStep} />
                  </div>
                ) : steps.length === 0 ? (
                  <div className={styles.empty}>
                    <div className={styles.emptyTitle}>0 шагов</div>
                  </div>
                ) : (
                  <div className={styles.steps}>
                    {steps.map((s, idx) => {
                      const done =
                        String(s.state || "").toLowerCase() === "completed";
                      const completing = completeLoadingId === s.id;
                      const updatingState = stateLoadingId === s.id;
                      const stateValue = normalizeStepStateValue(s.state);

                      return (
                        <div key={s.id} className={styles.step}>
                          <div className={styles.stepLeft}>
                            <div className={styles.stepIndex}>{idx + 1}</div>
                          </div>

                          <div className={styles.stepMain}>
                            <div className={styles.stepTop}>
                              <div
                                className={styles.stepTitle}
                                title={`StepId: ${s.stepId} • UserStepId: ${s.id}`}
                              >
                                <span className={styles.stepKey}>StepId:</span>
                                <span className={styles.mono}>
                                  {String(s.stepId ?? "—")}
                                </span>
                                <span className={styles.stepIdSep}>•</span>
                                <span className={styles.stepKey}>
                                  UserStepId:
                                </span>
                                <span className={styles.mono}>
                                  {String(s.id ?? "—")}
                                </span>
                              </div>

                              <div className={styles.stepTopRight}>
                                <select
                                  className={[
                                    styles.badge,
                                    styles.stateSelect,
                                    stateClass(s.state),
                                  ].join(" ")}
                                  value={stateValue}
                                  onChange={(e) =>
                                    onChangeStepState(
                                      s.id,
                                      e.target.value as UserStepState
                                    )
                                  }
                                  disabled={
                                    stepsLoading ||
                                    selectedResolved ||
                                    completing ||
                                    updatingState
                                  }
                                  aria-label="Статус шага"
                                >
                                  {STEP_STATE_VALUES.map((value) => (
                                    <option key={value} value={value}>
                                      {stateLabel(value)}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  type="button"
                                  className={styles.stepActionBtn}
                                  onClick={() => onCompleteStep(s.id)}
                                  disabled={
                                    done ||
                                    completing ||
                                    updatingState ||
                                    selectedResolved
                                  }
                                  title={
                                    selectedResolved
                                      ? "Болезнь завершена"
                                      : done
                                        ? "Уже выполнено"
                                        : "Отметить выполненным"
                                  }
                                >
                                  <CheckIcon
                                    className={styles.stepActionIcon}
                                  />
                                </button>
                              </div>
                            </div>

                            <div className={styles.stepGrid}>
                              <div className={styles.stepLine}>
                                <span className={styles.stepLabel}>
                                  Создан:
                                </span>
                                <span className={styles.stepValue}>
                                  {fmtDate(s.createdAt)}
                                </span>
                              </div>

                              <div className={styles.stepLine}>
                                <span className={styles.stepLabel}>
                                  Обновлён:
                                </span>
                                <span className={styles.stepValue}>
                                  {fmtDate(s.updatedAt)}
                                </span>
                              </div>

                              <div className={styles.stepLine}>
                                <span className={styles.stepLabel}>
                                  Завершён:
                                </span>
                                <span className={styles.stepValue}>
                                  {fmtDate(s.completedAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </section>
        </div>
      </main>

      <FloatingBurgerMenu
        role={role}
        position="left"
        showBack={true}
        showPersonal={false}
        showAdmin={false}
        backLabel="Назад"
        onBack={() => router.push("/profile")}
      />
    </div>
  );
}
