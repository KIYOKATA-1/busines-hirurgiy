"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import styles from "./AssignDiseaseModal.module.scss";

import { diseaseService } from "@/services/disease/disease.service";
import type { IDiseaseListEntry } from "@/services/disease/disease.types";

import { useToast } from "@/app/components/Toast/ToastProvider";

type LoadState = "idle" | "loading" | "success" | "error";

type Props = {
  open: boolean;

  userId: string;
  userLabel: string;

  loading?: boolean;
  error?: string | null;

  onClose: () => void;
  onAssign: (diseaseId: string) => void;
};

function safeStr(v: any) {
  return typeof v === "string" ? v : "";
}

function byTitle(a: IDiseaseListEntry, b: IDiseaseListEntry) {
  const at = safeStr(a?.disease?.title).toLowerCase();
  const bt = safeStr(b?.disease?.title).toLowerCase();
  return at.localeCompare(bt);
}

export default function AssignDiseaseModal({
  open,
  userId,
  userLabel,
  loading = false,
  error = null,
  onClose,
  onAssign,
}: Props) {
  const toast = useToast();

  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [listError, setListError] = useState<string | null>(null);
  const [items, setItems] = useState<IDiseaseListEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchDiseases = async () => {
    setLoadState("loading");
    setListError(null);

    try {
      const res = await diseaseService.getAll();
      if (!mountedRef.current) return;

      const sorted = [...(res ?? [])].sort(byTitle);
      setItems(sorted);
      setLoadState("success");
    } catch (e: any) {
      if (!mountedRef.current) return;
      const msg = e?.response?.data?.message || e?.message || "Не удалось загрузить болезни";
      const text = String(msg);
      setListError(text);
      setLoadState("error");
      toast.error(text);
    }
  };

  useEffect(() => {
    if (!open) return;

    setSelectedId("");
    setListError(null);
    setLoadState("idle");
    setItems([]);

    fetchDiseases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!loading) onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, loading]);

  const isLoading = loadState === "loading";
  const isError = loadState === "error";
  const isSuccess = loadState === "success";

  const canAssign = !!selectedId && !loading && !isLoading;

  const viewItems = useMemo(() => {
    return (items ?? []).map((x) => {
      const id = safeStr(x?.disease?.id);
      const title = safeStr(x?.disease?.title) || "Без названия";
      const cat = safeStr(x?.disease?.category?.title);
      return { id, title, cat };
    });
  }, [items]);

  const closeSafe = () => {
    if (loading) return;
    onClose();
  };

  const onOverlayMouseDown = (e: ReactMouseEvent<HTMLElement>) => {
    if (e.target === e.currentTarget) closeSafe();
  };

  if (!open) return null;

  return (
    <section
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Привязать болезнь"
      onMouseDown={onOverlayMouseDown}
    >
      <section className={styles.modal}>
        <header className={styles.head}>
          <div className={styles.headText}>
            <h3 className={styles.title}>Привязать болезнь</h3>
            <p className={styles.subTitle}>
              Пользователь: <b>{userLabel}</b>
            </p>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={closeSafe}
            aria-label="Закрыть"
            disabled={loading}
          >
            ✕
          </button>
        </header>

        <section className={styles.content}>
          {isLoading ? (
            <p className={styles.stateText}>Загрузка списка болезней...</p>
          ) : isError ? (
            <div className={styles.errorBox} role="alert">
              <p className={styles.errorText}>{listError}</p>
              <button
                type="button"
                className={styles.retryBtn}
                onClick={fetchDiseases}
                disabled={loading}
              >
                Повторить
              </button>
            </div>
          ) : isSuccess && viewItems.length === 0 ? (
            <p className={styles.stateText}>Болезни не найдены</p>
          ) : (
            <ul className={styles.list} aria-label="Список болезней">
              {viewItems.map((d) => {
                const active = d.id === selectedId;

                return (
                  <li key={d.id} className={styles.item}>
                    <button
                      type="button"
                      className={`${styles.row} ${active ? styles.rowActive : ""}`}
                      onClick={() => setSelectedId(d.id)}
                      disabled={loading}
                    >
                      <span className={styles.radio} aria-hidden="true">
                        <span className={`${styles.dot} ${active ? styles.dotActive : ""}`} />
                      </span>

                      <span className={styles.rowText}>
                        <span className={styles.rowTitle}>{d.title}</span>
                        {d.cat ? <span className={styles.rowSub}>Категория: {d.cat}</span> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {error ? (
            <div className={styles.serverError} role="alert">
              {error}
            </div>
          ) : null}
        </section>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={closeSafe}
            disabled={loading}
          >
            Отмена
          </button>

          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => onAssign(selectedId)}
            disabled={!canAssign}
          >
            {loading ? "Привязка..." : "Привязать"}
          </button>
        </footer>

        <span className={styles.metaHidden} aria-hidden="true">
          {userId}
        </span>
      </section>
    </section>
  );
}
