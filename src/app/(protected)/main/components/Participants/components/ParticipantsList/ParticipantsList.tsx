"use client";

import styles from "./ParticipantsList.module.scss";
import type { IModeratorDashboardUser } from "@/services/moderatorUsers/moderatorUsers.types";
import { DeleteIcon, EditIcon, EyeIcon } from "./ParticipantsList.icons";

type LoadState = "idle" | "loading" | "success" | "error";

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
};

function SkeletonCard({ idx }: { idx: number }) {
  return (
    <li className={styles.item} key={`sk_${idx}`}>
      <article className={`${styles.card} ${styles.cardSkeleton}`} aria-hidden="true">
        <header className={styles.cardTop}>
          <section className={styles.userLeft}>
            <span className={`${styles.avatar} ${styles.skel}`} />
            <section className={styles.meta}>
              <span className={`${styles.skelLine} ${styles.skelLineLg}`} />
              <span className={`${styles.skelLine} ${styles.skelLineMd}`} />
              <span className={`${styles.skelLine} ${styles.skelLineSm}`} />
            </section>
          </section>

          <section className={styles.actions}>
            <span className={`${styles.skelBtn} ${styles.skel}`} />
            <span className={`${styles.skelIconBtn} ${styles.skel}`} />
            <span className={`${styles.skelIconBtn} ${styles.skel}`} />
          </section>
        </header>

        <section className={styles.metrics} aria-label="Метрики (скелетон)">
          <article className={`${styles.metric} ${styles.metricSkeleton}`}>
            <span className={`${styles.skelLine} ${styles.skelLineSm}`} />
            <span className={`${styles.skelLine} ${styles.skelLineMd}`} />
          </article>

          <article className={`${styles.metric} ${styles.metricSkeleton}`}>
            <span className={`${styles.skelLine} ${styles.skelLineSm}`} />
            <span className={`${styles.skelLine} ${styles.skelLineMd}`} />
          </article>

          <article className={`${styles.metric} ${styles.metricSkeleton}`}>
            <span className={`${styles.skelLine} ${styles.skelLineSm}`} />
            <span className={`${styles.skelLine} ${styles.skelLineMd}`} />
          </article>
        </section>

        <section className={styles.progress} aria-label="Прогресс (скелетон)">
          <span className={`${styles.skelLine} ${styles.skelLineSm}`} />
          <section className={styles.progressRow}>
            <span className={`${styles.track} ${styles.trackSkeleton}`}>
              <span className={`${styles.fill} ${styles.fillSkeleton}`} />
            </span>
            <span className={`${styles.badge} ${styles.badgeSkeleton}`} />
          </section>
        </section>
      </article>
    </li>
  );
}

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
}: Props) {
  const isLoading = loadState === "loading";
  const isError = loadState === "error";
  const isSuccess = loadState === "success";

  const totalText = isSuccess ? String(total) : "—";
  const pageText = isSuccess ? String(currentPage) : "—";
  const pagesText = isSuccess ? String(totalPages) : "—";

  const pagerDisabled = !isSuccess || isLoading || isError;

  const showSkeleton = isLoading || loadState === "idle";
  const showEmpty = isSuccess && users.length === 0;

  return (
    <section className={styles.block} aria-label="Список участников">
      <header className={styles.head}>
        <h2 className={styles.title}>Список участников</h2>
        <p className={styles.desc}>Отслеживание прогресса и активности участников</p>
      </header>

      <section className={styles.body}>
        {showSkeleton ? (
          <ul className={styles.list} aria-label="Загрузка участников">
            <SkeletonCard idx={1} />
            <SkeletonCard idx={2} />
            <SkeletonCard idx={3} />
          </ul>
        ) : isError ? (
          <section className={styles.errorBox} role="alert">
            <h3 className={styles.errorTitle}>Не удалось загрузить</h3>
            <p className={styles.errorText}>{error}</p>
            <button className={styles.retryBtn} type="button" onClick={onRetry}>
              Повторить
            </button>
          </section>
        ) : showEmpty ? (
          <p className={styles.placeholder}>Пользователи не найдены</p>
        ) : (
          <ul className={styles.list} aria-label="Участники">
            {users.map((u) => {
              const pct = clampPct(safeNum(u.overallProgressPct));
              const completed = safeNum(u.completedSteps);
              const totalSteps = Math.max(1, safeNum(u.totalSteps));
              const initials = getInitials(u.name, u.surname);

              return (
                <li key={u.id} className={styles.item}>
                  <article className={styles.card}>
                    <header className={styles.cardTop}>
                      <section className={styles.userLeft}>
                        <span className={styles.avatar} aria-hidden="true">
                          {initials}
                        </span>

                        <section className={styles.meta}>
                          <h3 className={styles.userName}>
                            {u.name} {u.surname}
                          </h3>
                          <p className={styles.email}>{u.email}</p>
                          <p className={styles.activity}>
                            Последняя активность: {formatLastActivityHuman(u.lastActivityAt)}
                          </p>
                        </section>
                      </section>

                      <section className={styles.actions} aria-label="Действия">
                        <button type="button" className={styles.viewBtn} onClick={() => {}}>
                          <span className={styles.viewIcon} aria-hidden="true">
                            <EyeIcon className={styles.svgIcon} />
                          </span>
                          <span className={styles.viewText}>Просмотр</span>
                        </button>

                        <button
                          type="button"
                          className={styles.iconBtn}
                          aria-label="Редактировать"
                          onClick={() => {}}
                        >
                          <EditIcon className={styles.svgIcon} />
                        </button>

                        <button
                          type="button"
                          className={styles.iconBtnDanger}
                          aria-label="Удалить"
                          onClick={() => {}}
                        >
                          <DeleteIcon className={styles.svgIcon} />
                        </button>
                      </section>
                    </header>

                    <section className={styles.metrics} aria-label="Метрики">
                      <article className={styles.metric}>
                        <p className={styles.metricLabel}>Активные проблемы</p>
                        <p className={styles.metricValue}>{safeNum(u.activeDiseases)}</p>
                      </article>

                      <article className={styles.metric}>
                        <p className={styles.metricLabel}>Выполнено шагов</p>
                        <p className={styles.metricValue}>
                          {completed}/{totalSteps}
                        </p>
                      </article>

                      <article className={styles.metric}>
                        <p className={styles.metricLabel}>Общий прогресс</p>
                        <p className={styles.metricValue}>{pct}%</p>
                      </article>
                    </section>

                    <section className={styles.progress} aria-label="Прогресс лечения">
                      <p className={styles.progressLabel}>Прогресс лечения</p>

                      <section className={styles.progressRow}>
                        <span className={styles.track} aria-hidden="true">
                          <span className={styles.fill} style={{ width: `${pct}%` }} />
                        </span>

                        <span className={styles.badge}>{pct}%</span>
                      </section>
                    </section>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer className={styles.footer}>
        <p className={styles.footerMeta}>
          Всего: <b>{totalText}</b> · Страница: <b>{pageText}</b>/<b>{pagesText}</b>
        </p>

        <section className={styles.pager} aria-label="Пагинация">
          <button
            type="button"
            className={styles.pagerBtn}
            onClick={onPrev}
            disabled={pagerDisabled || !canPrev}
          >
            ← Назад
          </button>

          <button
            type="button"
            className={styles.pagerBtn}
            onClick={onNext}
            disabled={pagerDisabled || !canNext}
          >
            Вперёд →
          </button>
        </section>
      </footer>
    </section>
  );
}
