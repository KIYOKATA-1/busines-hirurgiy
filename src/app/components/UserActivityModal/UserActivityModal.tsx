"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./UserActivityModal.module.scss";

import type {
  IModeratorUserActivityItem,
  IModeratorUserActivityResponse,
} from "@/services/moderatorUsers/moderatorUsers.types";

import { moderatorUsersService } from "@/services/moderatorUsers/moderatorUsers.service";
import { useToast } from "@/app/components/Toast/ToastProvider";

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

function formatActivityText(item: IModeratorUserActivityItem) {
  if (item.type === "assignment") {
    return {
      title: `Назначено: ${item.payload.title}`,
      subtitle: `Шагов: ${item.payload.totalSteps}`,
      badge: "Назначение",
    };
  }

  if (item.type === "step_completed") {
    return {
      title: "Шаг выполнен",
      subtitle: `stepId: ${item.payload.stepId}`,
      badge: "Шаг",
    };
  }

  return {
    title: `Статус: ${item.payload.to}`,
    subtitle: `Причина: ${item.payload.reason}`,
    badge: "Статус",
  };
}

export default function UserActivityModal({
  open,
  userId,
  title,
  onClose,
  initialLimit = 20,
  initialOffset = 0,
}: Props) {
  const toast = useToast();

  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<IModeratorUserActivityItem[]>([]);
  const [total, setTotal] = useState(0);

  const [limit, setLimit] = useState(initialLimit);
  const [offset, setOffset] = useState(initialOffset);

  const canLoadMore = items.length < total;

  const reset = () => {
    setLoadState("idle");
    setError(null);
    setItems([]);
    setTotal(0);
    setLimit(initialLimit);
    setOffset(initialOffset);
  };

  const fetchPage = async (nextOffset: number, mode: "replace" | "append") => {
    if (!userId) return;

    setLoadState("loading");
    setError(null);

    try {

      const res: IModeratorUserActivityResponse =
        await moderatorUsersService.getUserActivity(userId, {
          limit,
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
    await fetchPage(next, "append");
  };

  const onRetry = async () => {
    setOffset(initialOffset);
    await fetchPage(initialOffset, "replace");
  };

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }

    const startOffset = initialOffset;
    setLimit(initialLimit);
    setOffset(startOffset);

    fetchPage(startOffset, "replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId, initialLimit, initialOffset]);

  const isLoading = loadState === "loading";
  const isError = loadState === "error";
  const isSuccess = loadState === "success";
  const empty = isSuccess && items.length === 0;

  const safeTitle = useMemo(() => title || "Активность", [title]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="Активность пользователя">
      <div className={styles.modal}>
        <header className={styles.head}>
          <div className={styles.headLeft}>
            <h3 className={styles.title}>{safeTitle}</h3>
            <p className={styles.subTitle}>
              Всего событий: <b>{isSuccess ? total : "—"}</b> · Пачка: <b>{limit}</b>
            </p>
          </div>

          <button className={styles.closeBtn} type="button" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </header>

        <section className={styles.body}>
          {isLoading && items.length === 0 ? (
            <div className={styles.loadingBox}>
              <div className={styles.spinner} aria-hidden="true" />
              <p className={styles.loadingText}>Загрузка…</p>
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
          ) : (
            <ul className={styles.list}>
              {items.map((it) => {
                const f = formatActivityText(it);
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
