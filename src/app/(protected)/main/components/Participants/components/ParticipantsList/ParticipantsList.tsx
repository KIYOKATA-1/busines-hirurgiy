"use client";

import { useState } from "react";
import styles from "./ParticipantsList.module.scss";

import type { IModeratorDashboardUser } from "@/services/moderatorUsers/moderatorUsers.types";
import { DeleteIcon, EditIcon, EyeIcon, PlusIcon } from "./ParticipantsList.icons";

import { moderatorUsersService } from "@/services/moderatorUsers/moderatorUsers.service";
import EditParticipantModal from "@/app/components/EditParticipantModal/EditParticipantModal";
import DeleteParticipantModal from "@/app/components/DeleteParticipantModal/DeleteParticipantModal";
import AssignDiseaseModal from "@/app/components/AssignDiseaseModal/AssignDiseaseModal";

import { useToast } from "@/app/components/Toast/ToastProvider";

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

function safeMaxOffset(totalAfter: number, limit: number) {
  if (totalAfter <= 0) return 0;
  const lastIndex = totalAfter - 1;
  return Math.floor(lastIndex / Math.max(1, limit)) * Math.max(1, limit);
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

  limit: number;
  offset: number;
  onSetOffset: (v: number | ((prev: number) => number)) => void;
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
  limit,
  offset,
  onSetOffset,
}: Props) {
  const toast = useToast();

  const isLoading = loadState === "loading";
  const isError = loadState === "error";
  const isSuccess = loadState === "success";

  const totalText = isSuccess ? String(total) : "—";
  const pageText = isSuccess ? String(currentPage) : "—";
  const pagesText = isSuccess ? String(totalPages) : "—";

  const pagerDisabled = !isSuccess || isLoading || isError;

  const showSkeleton = isLoading || loadState === "idle";
  const showEmpty = isSuccess && users.length === 0;

  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<IModeratorDashboardUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [delOpen, setDelOpen] = useState(false);
  const [delUser, setDelUser] = useState<IModeratorDashboardUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUser, setAssignUser] = useState<IModeratorDashboardUser | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const openEdit = (u: IModeratorDashboardUser) => {
    setEditUser(u);
    setSaveError(null);
    setEditOpen(true);
  };

  const closeEdit = () => {
    if (saving) return;
    setEditOpen(false);
  };

  const saveEdit = async (payload: { name: string; surname: string }) => {
    if (!editUser) return;

    setSaving(true);
    setSaveError(null);

    try {
      await moderatorUsersService.updateUser(editUser.id, payload);
      toast.success("Пользователь обновлён");
      setEditOpen(false);
      setEditUser(null);
      onRetry();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Не удалось обновить пользователя";
      const text = String(msg);
      setSaveError(text);
      toast.error(text);
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (u: IModeratorDashboardUser) => {
    setDelUser(u);
    setDelError(null);
    setDelOpen(true);
  };

  const closeDelete = () => {
    if (deleting) return;
    setDelOpen(false);
  };

  const confirmDelete = async () => {
    if (!delUser) return;

    setDeleting(true);
    setDelError(null);

    try {
      await moderatorUsersService.deleteUser(delUser.id);
      toast.success("Пользователь удалён");

      const totalAfter = Math.max(0, safeNum(total) - 1);
      const maxOffsetAfter = safeMaxOffset(totalAfter, limit);

      setDelOpen(false);
      setDelUser(null);

      if (offset > maxOffsetAfter) {
        onSetOffset(maxOffsetAfter);
        return;
      }

      onRetry();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Не удалось удалить пользователя";
      const text = String(msg);
      setDelError(text);
      toast.error(text);
    } finally {
      setDeleting(false);
    }
  };

  const openAssign = (u: IModeratorDashboardUser) => {
    setAssignUser(u);
    setAssignError(null);
    setAssignOpen(true);
  };

  const closeAssign = () => {
    if (assigning) return;
    setAssignOpen(false);
  };

  const confirmAssign = async (diseaseId: string) => {
    if (!assignUser) return;

    setAssigning(true);
    setAssignError(null);

    try {
      await moderatorUsersService.assignDisease({
        diseaseId,
        userId: assignUser.id,
      });

      toast.success("Болезнь привязана");
      setAssignOpen(false);
      setAssignUser(null);
      onRetry();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Не удалось привязать болезнь";
      const text = String(msg);
      setAssignError(text);
      toast.error(text);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <>
      <section className={styles.block} aria-label="Список участников">
        <header className={styles.head}>
          <div className={styles.headTop}>
            <h2 className={styles.title}>Список участников</h2>
            <p className={styles.counter}>
              {isSuccess ? (
                <>
                  <span>Показано:</span> <b>{users.length}</b>/<b>{totalText}</b>
                </>
              ) : (
                <>
                  <span>Показано:</span> <b>—</b>/<b>—</b>
                </>
              )}
            </p>
          </div>
          <p className={styles.desc}>Отслеживание прогресса и активности участников</p>
        </header>

        <section className={styles.body}>
          {showSkeleton ? (
            <ul className={styles.list} aria-label="Загрузка участников">
              {Array.from({ length: Math.max(1, limit) }).map((_, i) => (
                <SkeletonCard key={i} idx={i + 1} />
              ))}
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
                            className={styles.iconBtnPrimary}
                            aria-label="Привязать болезнь"
                            onClick={() => openAssign(u)}
                          >
                            <PlusIcon className={styles.plusIcon} />
                          </button>

                          <button
                            type="button"
                            className={styles.iconBtn}
                            aria-label="Редактировать"
                            onClick={() => openEdit(u)}
                          >
                            <EditIcon className={styles.svgIcon} />
                          </button>

                          <button
                            type="button"
                            className={styles.iconBtnDanger}
                            aria-label="Удалить"
                            onClick={() => openDelete(u)}
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
                        <div className={styles.progressTop}>
                          <p className={styles.progressLabel}>Прогресс лечения</p>
                          <span className={styles.badge}>{pct}%</span>
                        </div>

                        <section className={styles.progressRow}>
                          <span className={styles.track} aria-hidden="true">
                            <span className={styles.fill} style={{ width: `${pct}%` }} />
                          </span>
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

      <EditParticipantModal
        open={editOpen}
        initialName={editUser?.name ?? ""}
        initialSurname={editUser?.surname ?? ""}
        loading={saving}
        error={saveError}
        onClose={closeEdit}
        onSave={saveEdit}
      />

      <DeleteParticipantModal
        open={delOpen}
        title="Удалить пользователя?"
        description={
          delUser
            ? `Вы уверены, что хотите удалить пользователя ${delUser.name} ${delUser.surname}?`
            : "Вы уверены, что хотите удалить пользователя?"
        }
        loading={deleting}
        error={delError}
        onClose={closeDelete}
        onConfirm={confirmDelete}
      />

      <AssignDiseaseModal
        open={assignOpen}
        userId={assignUser?.id ?? ""}
        userLabel={assignUser ? `${assignUser.name} ${assignUser.surname}` : "—"}
        loading={assigning}
        error={assignError}
        onClose={closeAssign}
        onAssign={confirmAssign}
      />
    </>
  );
}
