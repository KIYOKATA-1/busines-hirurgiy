"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Participants.module.scss";

import { moderatorUsersService } from "@/services/moderatorUsers/moderatorUsers.service";
import type {
  IModeratorDashboardResponse,
  IModeratorDashboardUser,
} from "@/services/moderatorUsers/moderatorUsers.types";

import { diseaseService } from "@/services/disease/disease.service";
import type { IDiseaseListEntry } from "@/services/disease/disease.types";

type LoadState = "idle" | "loading" | "success" | "error";
type ModalState = "idle" | "loading" | "success" | "error";

function clampPct(v: number) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatLastActivityHuman(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч назад`;
  const days = Math.floor(h / 24);
  return `${days} дн назад`;
}

function isActiveWithin24h(iso?: string) {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return Date.now() - d.getTime() <= 24 * 60 * 60 * 1000;
}

function getInitials(name?: string, surname?: string) {
  const n = (name ?? "").trim();
  const s = (surname ?? "").trim();
  const a = n ? n[0].toUpperCase() : "";
  const b = s ? s[0].toUpperCase() : "";
  return (a + b).trim() || "•";
}

export default function Participants() {
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<IModeratorDashboardResponse | null>(null);

  const [limit, setLimit] = useState<number>(20);
  const [offset, setOffset] = useState<number>(0);

  const abortRef = useRef({ aborted: false });

  const stats = dashboard?.stats;

  const serverLimit = dashboard?.users?.limit ?? limit;
  const serverOffset = dashboard?.users?.offset ?? offset;
  const total = dashboard?.users?.total ?? 0;

  const totalPages = serverLimit > 0 ? Math.max(1, Math.ceil(total / serverLimit)) : 1;
  const currentPage = serverLimit > 0 ? Math.floor(serverOffset / serverLimit) + 1 : 1;

  const canPrev = serverOffset > 0;
  const canNext = serverOffset + serverLimit < total;

  const users: IModeratorDashboardUser[] = useMemo(
    () => dashboard?.users?.items ?? [],
    [dashboard]
  );

  const totalParticipants = safeNum(stats?.totalParticipants);
  const avgProgressPercent = clampPct(safeNum(stats?.avgProgressPercent));
  const activeProblems = safeNum(stats?.activeProblems);

  const fetchDashboard = async (params?: { limit?: number; offset?: number }) => {
    setLoadState("loading");
    setError(null);
    abortRef.current.aborted = false;

    const reqLimit = params?.limit ?? limit;
    const reqOffset = params?.offset ?? offset;

    try {
      const res = await moderatorUsersService.getDashboard({
        limit: reqLimit,
        offset: reqOffset,
      });

      if (abortRef.current.aborted) return;

      setDashboard(res);
      setLoadState("success");

      const nextLimit = res.users?.limit ?? reqLimit;
      const nextOffset = res.users?.offset ?? reqOffset;

      setLimit((prev) => (prev !== nextLimit ? nextLimit : prev));
      setOffset((prev) => (prev !== nextOffset ? nextOffset : prev));
    } catch (e: any) {
      if (abortRef.current.aborted) return;
      const msg = e?.response?.data?.message || e?.message || "Ошибка загрузки dashboard";
      setError(String(msg));
      setLoadState("error");
    }
  };

  useEffect(() => {
    fetchDashboard();
    return () => {
      abortRef.current.aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goPrev = () => {
    const nextOffset = Math.max(0, serverOffset - serverLimit);
    setOffset(nextOffset);
    fetchDashboard({ limit: serverLimit, offset: nextOffset });
  };

  const goNext = () => {
    const nextOffset = serverOffset + serverLimit;
    setOffset(nextOffset);
    fetchDashboard({ limit: serverLimit, offset: nextOffset });
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IModeratorDashboardUser | null>(null);

  const [diseaseState, setDiseaseState] = useState<ModalState>("idle");
  const [diseaseError, setDiseaseError] = useState<string | null>(null);
  const [diseases, setDiseases] = useState<IDiseaseListEntry[]>([]);
  const [diseaseSearch, setDiseaseSearch] = useState("");
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string | null>(null);

  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const openModalForUser = (u: IModeratorDashboardUser) => {
    setSelectedUser(u);
    setSelectedDiseaseId(null);
    setAssignError(null);
    setDiseaseSearch("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
    setSelectedDiseaseId(null);
    setAssignError(null);
  };

  const loadDiseases = async () => {
    setDiseaseState("loading");
    setDiseaseError(null);

    try {
      const res = await diseaseService.getAll();
      setDiseases(res);
      setDiseaseState("success");
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Ошибка загрузки болезней";
      setDiseaseError(String(msg));
      setDiseaseState("error");
    }
  };

  useEffect(() => {
    if (!modalOpen) return;
    if (diseases.length > 0) {
      setDiseaseState("success");
      return;
    }
    loadDiseases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen]);

  const filteredDiseases = useMemo(() => {
    const q = diseaseSearch.trim().toLowerCase();
    if (!q) return diseases;
    return diseases.filter((d) => {
      const title = d.disease?.title?.toLowerCase() ?? "";
      const cat = d.disease?.category?.title?.toLowerCase() ?? "";
      const desc = d.disease?.description?.toLowerCase() ?? "";
      return title.includes(q) || cat.includes(q) || desc.includes(q);
    });
  }, [diseases, diseaseSearch]);

  const canAssign = Boolean(selectedUser?.id) && Boolean(selectedDiseaseId) && !assignLoading;

  const onAssign = async () => {
    if (!selectedUser?.id || !selectedDiseaseId) return;

    setAssignLoading(true);
    setAssignError(null);

    try {
      await moderatorUsersService.assignDisease({
        userId: selectedUser.id,
        diseaseId: selectedDiseaseId,
      });

      await fetchDashboard({ limit: serverLimit, offset: serverOffset });
      closeModal();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Ошибка привязки болезни";
      setAssignError(String(msg));
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      {loadState === "success" ? (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statHead}>
              <div className={styles.statTitle}>Всего участников</div>
              <div className={styles.statIcon} aria-hidden="true" />
            </div>
            <div className={styles.statValue}>{totalParticipants}</div>
            <div className={styles.statSub}>Активных пользователей</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHead}>
              <div className={styles.statTitle}>Средний прогресс</div>
              <div className={styles.statIcon} aria-hidden="true" />
            </div>
            <div className={styles.statValue}>{avgProgressPercent}%</div>
            <div className={styles.statSub}>По всем участникам</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHead}>
              <div className={styles.statTitle}>Активные проблемы</div>
              <div className={styles.statIconDanger} aria-hidden="true" />
            </div>
            <div className={styles.statValue}>{activeProblems}</div>
            <div className={styles.statSub}>Требуют внимания</div>
          </div>
        </div>
      ) : null}

      <div className={styles.block}>
        <div className={styles.blockHead}>
          <div>
            <div className={styles.blockTitle}>Список участников</div>
            <div className={styles.blockDesc}>Отслеживание прогресса и активности участников</div>
          </div>
        </div>

        {loadState === "loading" ? (
          <div className={styles.placeholder}>Загрузка...</div>
        ) : loadState === "error" ? (
          <div className={styles.errorBox}>
            <div className={styles.errorTitle}>Не удалось загрузить</div>
            <div className={styles.errorText}>{error}</div>
            <button className={styles.retryBtn} type="button" onClick={() => fetchDashboard()}>
              Повторить
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className={styles.placeholder}>Пользователи не найдены</div>
        ) : (
          <>
            <div className={styles.list}>
              {users.map((u) => {
                const pct = clampPct(safeNum(u.overallProgressPct));
                const completed = safeNum(u.completedSteps);
                const totalSteps = Math.max(1, safeNum(u.totalSteps));
                const initials = getInitials(u.name, u.surname);

                return (
                  <article key={u.id} className={styles.userCard}>
                    <div className={styles.userTop}>
                      <div className={styles.userLeft}>
                        <div className={styles.avatar} aria-hidden="true">
                          {initials}
                        </div>

                        <div className={styles.userMeta}>
                          <div className={styles.userNameRow}>
                            <div className={styles.userName}>
                              {u.name} {u.surname}
                            </div>

                            {isActiveWithin24h(u.lastActivityAt) ? (
                              <span className={styles.activeDot} title="Активен" />
                            ) : null}
                          </div>

                          <div className={styles.userEmail}>{u.email}</div>
                          <div className={styles.userActivity}>
                            Последняя активность: {formatLastActivityHuman(u.lastActivityAt)}
                          </div>
                        </div>
                      </div>

                      <div className={styles.userActions}>
                        <button
                          type="button"
                          className={styles.bindBtn}
                          data-tip="Привязать болезнь"
                          aria-label="Привязать болезнь"
                          onClick={() => openModalForUser(u)}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className={styles.metricsRow}>
                      <div className={styles.metricBox}>
                        <div className={styles.metricLabel}>Активные проблемы</div>
                        <div className={styles.metricValue}>{safeNum(u.activeDiseases)}</div>
                      </div>

                      <div className={styles.metricBox}>
                        <div className={styles.metricLabel}>Выполнено шагов</div>
                        <div className={styles.metricValue}>
                          {completed}/{totalSteps}
                        </div>
                      </div>

                      <div className={styles.metricBox}>
                        <div className={styles.metricLabel}>Общий прогресс</div>
                        <div className={styles.metricValue}>{pct}%</div>
                      </div>
                    </div>

                    <div className={styles.progressArea}>
                      <div className={styles.progressLabel}>Прогресс лечения</div>

                      <div className={styles.progressLine}>
                        <div className={styles.progressTrack}>
                          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                        </div>
                        <div className={styles.progressBadge}>{pct}%</div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className={styles.footer}>
              <div className={styles.meta}>
                Всего: <b>{total}</b> • Страница: <b>{currentPage}</b>/<b>{totalPages}</b>
              </div>

              <div className={styles.pager}>
                <button
                  type="button"
                  className={styles.pagerBtn}
                  onClick={goPrev}
                >
                  ← Назад
                </button>

                <button
                  type="button"
                  className={styles.pagerBtn}
                  onClick={goNext}
                >
                  Вперёд →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {modalOpen ? (
        <div
          className={styles.modalOverlay}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modal}>
            <div className={styles.modalHead}>
              <div>
                <div className={styles.modalTitle}>Привязать болезнь</div>
                <div className={styles.modalSub}>
                  Пользователь:{" "}
                  <b>
                    {selectedUser?.name} {selectedUser?.surname}
                  </b>
                </div>
              </div>

              <button className={styles.modalClose} type="button" onClick={closeModal}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalSearch}>
                <input
                  className={styles.modalSearchInput}
                  value={diseaseSearch}
                  onChange={(e) => setDiseaseSearch(e.target.value)}
                  placeholder="Найти болезнь..."
                />
              </div>

              {diseaseState === "loading" ? (
                <div className={styles.modalPlaceholder}>Загрузка списка болезней...</div>
              ) : diseaseState === "error" ? (
                <div className={styles.modalErrorBox}>
                  <div className={styles.modalErrorTitle}>Не удалось загрузить болезни</div>
                  <div className={styles.modalErrorText}>{diseaseError}</div>
                  <button type="button" className={styles.modalRetryBtn} onClick={loadDiseases}>
                    Повторить
                  </button>
                </div>
              ) : filteredDiseases.length === 0 ? (
                <div className={styles.modalPlaceholder}>Болезни не найдены</div>
              ) : (
                <div className={styles.diseaseList}>
                  {filteredDiseases.map((entry) => {
                    const id = entry.disease.id;
                    const title = entry.disease.title;
                    const cat = entry.disease.category?.title ?? "";
                    const hasPlan = Boolean(entry.plan);
                    const stepsCount = entry.steps?.length ?? 0;
                    const selected = selectedDiseaseId === id;

                    return (
                      <button
                        key={id}
                        type="button"
                        className={`${styles.diseaseItem} ${
                          selected ? styles.diseaseItemActive : ""
                        }`}
                        onClick={() => setSelectedDiseaseId(id)}
                      >
                        <div className={styles.diseaseMain}>
                          <div className={styles.diseaseTitle}>{title}</div>
                          <div className={styles.diseaseMeta}>
                            {cat ? <span className={styles.diseaseTag}>{cat}</span> : null}
                            <span className={styles.diseaseTag}>
                              План: {hasPlan ? "есть" : "нет"}
                            </span>
                            <span className={styles.diseaseTag}>Шагов: {stepsCount}</span>
                          </div>
                        </div>

                        <div className={styles.diseasePick}>
                          <span
                            className={`${styles.pickDot} ${
                              selected ? styles.pickDotActive : ""
                            }`}
                            aria-hidden="true"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {assignError ? <div className={styles.assignError}>{assignError}</div> : null}
            </div>

            <div className={styles.modalFooter}>
              <button type="button" className={styles.modalGhostBtn} onClick={closeModal}>
                Отмена
              </button>

              <button
                type="button"
                className={styles.modalPrimaryBtn}
                disabled={!canAssign}
                onClick={onAssign}
              >
                {assignLoading ? "Привязка..." : "Привязать"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
