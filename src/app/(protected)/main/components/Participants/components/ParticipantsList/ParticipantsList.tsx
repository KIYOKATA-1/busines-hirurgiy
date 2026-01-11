"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./ParticipantsList.module.scss";

import type { IModeratorDashboardUser } from "@/services/moderatorUsers/moderatorUsers.types";
import { moderatorUsersService } from "@/services/moderatorUsers/moderatorUsers.service";

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

type Props = {
  loadState: LoadState;
  error: string | null;

  users: IModeratorDashboardUser[];

  total: number;
  currentPage: number;
  totalPages: number;

  canPrev: boolean;
  canNext: boolean;

  onPrev: () => void;
  onNext: () => void;
  onRetry: () => void;

  onAfterAssign: () => void;
};

export default function ParticipantsList({
  loadState,
  error,
  users,
  total,
  currentPage,
  totalPages,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onRetry,
  onAfterAssign,
}: Props) {
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

      onAfterAssign();
      closeModal();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Ошибка привязки болезни";
      setAssignError(String(msg));
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <section className={styles.block} aria-labelledby="participants_list_title">
      <header className={styles.blockHead}>
        <h2 className={styles.blockTitle} id="participants_list_title">
          Список участников
        </h2>
        <p className={styles.blockDesc}>Отслеживание прогресса и активности участников</p>
      </header>

      {loadState === "loading" ? (
        <p className={styles.placeholder}>Загрузка...</p>
      ) : loadState === "error" ? (
        <section className={styles.errorBox} role="alert">
          <h3 className={styles.errorTitle}>Не удалось загрузить</h3>
          <p className={styles.errorText}>{error}</p>
          <button className={styles.retryBtn} type="button" onClick={onRetry}>
            Повторить
          </button>
        </section>
      ) : users.length === 0 ? (
        <p className={styles.placeholder}>Пользователи не найдены</p>
      ) : (
        <>
          <ul className={styles.list} aria-label="Список пользователей">
            {users.map((u) => {
              const pct = clampPct(safeNum(u.overallProgressPct));
              const completed = safeNum(u.completedSteps);
              const totalSteps = Math.max(1, safeNum(u.totalSteps));
              const initials = getInitials(u.name, u.surname);

              return (
                <li key={u.id} className={styles.listItem}>
                  <article className={styles.userCard}>
                    <header className={styles.userTop}>
                      <section className={styles.userLeft} aria-label="Пользователь">
                        <span className={styles.avatar} aria-hidden="true">
                          {initials}
                        </span>

                        <section className={styles.userMeta}>
                          <section className={styles.userNameRow}>
                            <h3 className={styles.userName}>
                              {u.name} {u.surname}
                            </h3>

                            {isActiveWithin24h(u.lastActivityAt) ? (
                              <span className={styles.activeDot} title="Активен" />
                            ) : null}
                          </section>

                          <p className={styles.userEmail}>{u.email}</p>
                          <p className={styles.userActivity}>
                            Последняя активность: {formatLastActivityHuman(u.lastActivityAt)}
                          </p>
                        </section>
                      </section>

                      <menu className={styles.userActions} aria-label="Действия">
                        <button
                          type="button"
                          className={styles.bindBtn}
                          data-tip="Привязать болезнь"
                          aria-label="Привязать болезнь"
                          onClick={() => openModalForUser(u)}
                        >
                          +
                        </button>
                      </menu>
                    </header>

                    <section className={styles.metricsRow} aria-label="Показатели">
                      <article className={styles.metricBox}>
                        <p className={styles.metricLabel}>Активные проблемы</p>
                        <p className={styles.metricValue}>{safeNum(u.activeDiseases)}</p>
                      </article>

                      <article className={styles.metricBox}>
                        <p className={styles.metricLabel}>Выполнено шагов</p>
                        <p className={styles.metricValue}>
                          {completed}/{totalSteps}
                        </p>
                      </article>

                      <article className={styles.metricBox}>
                        <p className={styles.metricLabel}>Общий прогресс</p>
                        <p className={styles.metricValue}>{pct}%</p>
                      </article>
                    </section>

                    <section className={styles.progressArea} aria-label="Прогресс лечения">
                      <p className={styles.progressLabel}>Прогресс лечения</p>

                      <section className={styles.progressLine}>
                        <span className={styles.progressTrack} aria-hidden="true">
                          <span className={styles.progressFill} style={{ width: `${pct}%` }} />
                        </span>
                        <span className={styles.progressBadge}>{pct}%</span>
                      </section>
                    </section>
                  </article>
                </li>
              );
            })}
          </ul>

          <footer className={styles.footer}>
            <p className={styles.meta}>
              Всего: <b>{total}</b> • Страница: <b>{currentPage}</b>/<b>{totalPages}</b>
            </p>

            <nav className={styles.pager} aria-label="Пагинация">
              <button
                type="button"
                className={styles.pagerBtn}
                onClick={onPrev}
                disabled={!canPrev}
              >
                ← Назад
              </button>

              <button
                type="button"
                className={styles.pagerBtn}
                onClick={onNext}
                disabled={!canNext}
              >
                Вперёд →
              </button>
            </nav>
          </footer>
        </>
      )}

      {modalOpen ? (
        <section
          className={styles.modalOverlay}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Привязать болезнь"
        >
          <article className={styles.modal}>
            <header className={styles.modalHead}>
              <section>
                <h3 className={styles.modalTitle}>Привязать болезнь</h3>
                <p className={styles.modalSub}>
                  Пользователь:{" "}
                  <b>
                    {selectedUser?.name} {selectedUser?.surname}
                  </b>
                </p>
              </section>

              <button className={styles.modalClose} type="button" onClick={closeModal}>
                ✕
              </button>
            </header>

            <section className={styles.modalBody}>
              <section className={styles.modalSearch}>
                <input
                  className={styles.modalSearchInput}
                  value={diseaseSearch}
                  onChange={(e) => setDiseaseSearch(e.target.value)}
                  placeholder="Найти болезнь..."
                />
              </section>

              {diseaseState === "loading" ? (
                <p className={styles.modalPlaceholder}>Загрузка списка болезней...</p>
              ) : diseaseState === "error" ? (
                <section className={styles.modalErrorBox} role="alert">
                  <h4 className={styles.modalErrorTitle}>Не удалось загрузить болезни</h4>
                  <p className={styles.modalErrorText}>{diseaseError}</p>
                  <button type="button" className={styles.modalRetryBtn} onClick={loadDiseases}>
                    Повторить
                  </button>
                </section>
              ) : filteredDiseases.length === 0 ? (
                <p className={styles.modalPlaceholder}>Болезни не найдены</p>
              ) : (
                <ul className={styles.diseaseList} aria-label="Список болезней">
                  {filteredDiseases.map((entry) => {
                    const id = entry.disease.id;
                    const title = entry.disease.title;
                    const cat = entry.disease.category?.title ?? "";
                    const hasPlan = Boolean(entry.plan);
                    const stepsCount = entry.steps?.length ?? 0;
                    const selected = selectedDiseaseId === id;

                    return (
                      <li key={id} className={styles.diseaseListItem}>
                        <button
                          type="button"
                          className={`${styles.diseaseItem} ${
                            selected ? styles.diseaseItemActive : ""
                          }`}
                          onClick={() => setSelectedDiseaseId(id)}
                        >
                          <section className={styles.diseaseMain}>
                            <h4 className={styles.diseaseTitle}>{title}</h4>
                            <section className={styles.diseaseMeta}>
                              {cat ? <span className={styles.diseaseTag}>{cat}</span> : null}
                              <span className={styles.diseaseTag}>
                                План: {hasPlan ? "есть" : "нет"}
                              </span>
                              <span className={styles.diseaseTag}>Шагов: {stepsCount}</span>
                            </section>
                          </section>

                          <span className={styles.diseasePick} aria-hidden="true">
                            <span
                              className={`${styles.pickDot} ${
                                selected ? styles.pickDotActive : ""
                              }`}
                            />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {assignError ? <p className={styles.assignError}>{assignError}</p> : null}
            </section>

            <footer className={styles.modalFooter}>
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
            </footer>
          </article>
        </section>
      ) : null}
    </section>
  );
}
